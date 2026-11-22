"""Persistence for the ML engine.

PostgreSQL when DATABASE_URL is set (the deployment in the architecture diagram),
SQLite otherwise so the service runs locally with no setup. One small adapter so
the same SQL works on both.
"""

from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Iterable

DDL = """
CREATE TABLE IF NOT EXISTS ml_runs (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL,
  accuracy REAL NOT NULL,
  train_accuracy REAL NOT NULL,
  epochs INTEGER NOT NULL,
  samples INTEGER NOT NULL,
  params TEXT NOT NULL,
  loss TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  target TEXT NOT NULL,
  rationale TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_model ON ml_runs (model_id);
CREATE INDEX IF NOT EXISTS idx_actions_agent ON agent_actions (agent_id);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    """Thin wrapper: `?` placeholders, dict rows, both backends."""

    def __init__(self, url: str | None = None) -> None:
        self.url = url or os.environ.get("DATABASE_URL")
        self.kind = "postgres" if self.url else "sqlite"
        if self.kind == "postgres":
            import psycopg  # imported lazily: only needed when a URL is provided

            self._conn = psycopg.connect(self.url, autocommit=True)
        else:
            path = os.environ.get("MERIDIAN_DB", os.path.join(os.path.dirname(__file__), ".data", "ml.db"))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            self._conn = sqlite3.connect(path, check_same_thread=False)
            self._conn.row_factory = sqlite3.Row
        self._migrate()

    def _sql(self, statement: str) -> str:
        return statement.replace("?", "%s") if self.kind == "postgres" else statement

    def _migrate(self) -> None:
        for statement in [s.strip() for s in DDL.split(";") if s.strip()]:
            self._conn.execute(self._sql(statement))
        if self.kind == "sqlite":
            self._conn.commit()

    def execute(self, statement: str, params: Iterable[Any] = ()) -> None:
        self._conn.execute(self._sql(statement), tuple(params))
        if self.kind == "sqlite":
            self._conn.commit()

    def query(self, statement: str, params: Iterable[Any] = ()) -> list[dict]:
        if self.kind == "postgres":
            from psycopg.rows import dict_row

            with self._conn.cursor(row_factory=dict_row) as cur:
                cur.execute(self._sql(statement), tuple(params))
                return [dict(r) for r in cur.fetchall()]
        cur = self._conn.execute(statement, tuple(params))
        return [dict(r) for r in cur.fetchall()]

    # ------------------------------------------------------------------ runs

    def save_run(self, model_id: str, objective: str, result: dict) -> dict:
        run_id = f"mlr-{uuid.uuid4().hex[:10]}"
        self.execute(
            "INSERT INTO ml_runs (id, model_id, objective, status, accuracy, train_accuracy, epochs, samples, params, loss, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                run_id,
                model_id,
                objective,
                "Succeeded",
                result["accuracy"],
                result["trainAccuracy"],
                result["epochs"],
                result["samples"],
                json.dumps({"weights": result["weights"], "bias": result["bias"], "features": result["features"]}),
                json.dumps(result["lossCurve"]),
                _now(),
            ),
        )
        return self.get_run(run_id)  # type: ignore[return-value]

    def get_run(self, run_id: str) -> dict | None:
        rows = self.query("SELECT * FROM ml_runs WHERE id = ?", (run_id,))
        if not rows:
            return None
        row = rows[0]
        row["params"] = json.loads(row["params"])
        row["loss"] = json.loads(row["loss"])
        return row

    def list_runs(self, limit: int = 20) -> list[dict]:
        rows = self.query("SELECT * FROM ml_runs ORDER BY created_at DESC, id DESC LIMIT ?", (limit,))
        for row in rows:
            row["params"] = json.loads(row["params"])
            row["loss"] = json.loads(row["loss"])
        return rows

    # ---------------------------------------------------------------- actions

    def save_action(self, agent_id: str, kind: str, target: str, rationale: str, payload: dict) -> dict:
        action_id = f"act-{uuid.uuid4().hex[:10]}"
        self.execute(
            "INSERT INTO agent_actions (id, agent_id, kind, target, rationale, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (action_id, agent_id, kind, target, rationale, json.dumps(payload), _now()),
        )
        rows = self.query("SELECT * FROM agent_actions WHERE id = ?", (action_id,))
        row = rows[0]
        row["payload"] = json.loads(row["payload"])
        return row

    def list_actions(self, limit: int = 50) -> list[dict]:
        rows = self.query("SELECT * FROM agent_actions ORDER BY created_at DESC, id DESC LIMIT ?", (limit,))
        for row in rows:
            row["payload"] = json.loads(row["payload"])
        return rows
