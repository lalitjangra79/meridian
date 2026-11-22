import schema from '../../migrations/0001_init.sql?raw'

import { AGENTS, DATASETS, DECISIONS, INSIGHTS, MODELS, RUNS } from '../data'

/*
  D1 bootstrap.

  A Worker cannot run a migration step of its own, so the first request that
  reaches the API applies `migrations/0001_init.sql` (all `IF NOT EXISTS`) and
  seeds the tables from the checked-in data. Bumping SEED_VERSION reseeds the
  tables; the promise is cached per isolate, so this runs at most once.
*/

export const SEED_VERSION = '1'

let bootstrapped: Promise<void> | null = null

export function ready(db: D1Database): Promise<void> {
  bootstrapped ??= bootstrap(db).catch((err: unknown) => {
    bootstrapped = null
    throw err
  })
  return bootstrapped
}

/** Split the migration file into single statements (comments stripped). */
function statements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean)
}

async function bootstrap(db: D1Database) {
  for (const statement of statements(schema)) {
    await db.prepare(statement).run()
  }
  const current = await db.prepare('SELECT value FROM meta WHERE key = ?').bind('seed_version').first<{ value: string }>()
  if (current?.value === SEED_VERSION) return
  await seed(db)
}

async function seed(db: D1Database) {
  const stmts: D1PreparedStatement[] = [
    db.prepare('DELETE FROM runs'),
    db.prepare('DELETE FROM insights'),
    db.prepare('DELETE FROM decisions'),
    db.prepare('DELETE FROM datasets'),
    db.prepare('DELETE FROM agents'),
    db.prepare('DELETE FROM models'),
  ]

  for (const m of MODELS) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO models (id, name, code, domain, task, stage, version, accuracy, drift, latency_ms, inferences, owner, updated, risk_tier, features, datasets, guardrails, note, accuracy13, drift13)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          m.id,
          m.name,
          m.code,
          m.domain,
          m.task,
          m.stage,
          m.version,
          m.accuracy,
          m.drift,
          m.latencyMs,
          m.inferences,
          m.owner,
          m.updated,
          m.riskTier,
          m.features,
          JSON.stringify(m.datasets),
          JSON.stringify(m.guardrails),
          m.note,
          JSON.stringify(m.accuracy13),
          JSON.stringify(m.drift13),
        ),
    )
  }

  for (const a of AGENTS) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO agents (id, name, domain, description, default_autonomy, actions_today, success_rate, escalations, owner, guardrails, last_action, model_ids)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          a.id,
          a.name,
          a.domain,
          a.description,
          a.defaultAutonomy,
          a.actionsToday,
          a.successRate,
          a.escalations,
          a.owner,
          JSON.stringify(a.guardrails),
          a.lastAction,
          JSON.stringify(a.modelIds),
        ),
    )
  }

  for (const d of DECISIONS) {
    stmts.push(
      db
        .prepare('INSERT INTO decisions (id, time, agent_id, action, subject, confidence, outcome, value, domain) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(d.id, d.time, d.agentId, d.action, d.subject, d.confidence, d.outcome, d.value, d.domain),
    )
  }

  for (const d of DATASETS) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO datasets (id, name, domain, source, owner, row_count, quality, freshness_hours, pii, streaming, used_by, columns, issue)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(d.id, d.name, d.domain, d.source, d.owner, d.rows, d.quality, d.freshnessHours, d.pii ? 1 : 0, d.streaming ? 1 : 0, d.usedBy, JSON.stringify(d.columns), d.issue ?? null),
    )
  }

  for (const i of INSIGHTS) {
    stmts.push(
      db
        .prepare('INSERT INTO insights (id, kind, title, body, domain, impact, confidence, model_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(i.id, i.kind, i.title, i.body, i.domain, i.impact, i.confidence, i.modelId),
    )
  }

  for (const r of RUNS) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO runs (id, model_id, objective, status, started, duration, epochs, compute, cost, accuracy, owner, git_commit, loss)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(r.id, r.modelId, r.objective, r.status, r.started, r.duration, r.epochs, r.compute, r.cost, r.accuracy, r.owner, r.commit, JSON.stringify(r.loss)),
    )
  }

  stmts.push(db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind('seed_version', SEED_VERSION))

  await db.batch(stmts)
}
