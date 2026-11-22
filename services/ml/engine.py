"""Training and scoring for Meridian's ML engine.

Pure standard library: a seeded synthetic dataset, a logistic-regression model
trained with mini-batch gradient descent, and a real per-epoch loss curve. Nothing
here is pre-recorded — the numbers come from the run that just happened.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field


@dataclass
class Dataset:
    features: list[list[float]]
    labels: list[int]

    def split(self, holdout: float) -> tuple["Dataset", "Dataset"]:
        cut = int(len(self.labels) * (1 - holdout))
        return (
            Dataset(self.features[:cut], self.labels[:cut]),
            Dataset(self.features[cut:], self.labels[cut:]),
        )


@dataclass
class Model:
    weights: list[float] = field(default_factory=list)
    bias: float = 0.0

    def score(self, row: list[float]) -> float:
        z = self.bias + sum(w * x for w, x in zip(self.weights, row))
        return 1.0 / (1.0 + math.exp(-max(-30.0, min(30.0, z))))

    def predict(self, row: list[float]) -> int:
        return 1 if self.score(row) >= 0.5 else 0


def make_dataset(seed: int, samples: int, features: int = 6) -> Dataset:
    """A linearly separable-ish problem with label noise, like a real cohort."""
    rng = random.Random(seed)
    signal = [rng.uniform(1.5, 3.0) for _ in range(features)]
    rows: list[list[float]] = []
    labels: list[int] = []
    for _ in range(samples):
        row = [rng.gauss(0.0, 1.0) for _ in range(features)]
        z = sum(w * x for w, x in zip(signal, row)) + 0.6
        p = 1.0 / (1.0 + math.exp(-z))
        label = 1 if rng.random() < p else 0
        # 3% label noise: mislabelled rows the model can never fit.
        if rng.random() < 0.03:
            label = 1 - label
        rows.append(row)
        labels.append(label)
    return Dataset(rows, labels)


def accuracy(model: Model, data: Dataset) -> float:
    if not data.labels:
        return 0.0
    hits = sum(1 for row, label in zip(data.features, data.labels) if model.predict(row) == label)
    return hits / len(data.labels)


def log_loss(model: Model, data: Dataset) -> float:
    if not data.labels:
        return 0.0
    total = 0.0
    for row, label in zip(data.features, data.labels):
        p = min(1 - 1e-9, max(1e-9, model.score(row)))
        total += -(label * math.log(p) + (1 - label) * math.log(1 - p))
    return total / len(data.labels)


def train(
    seed: int = 7,
    samples: int = 900,
    features: int = 6,
    epochs: int = 60,
    learning_rate: float = 0.5,
    batch_size: int = 32,
    holdout: float = 0.2,
) -> dict:
    """Train the model and return the run's real evaluation evidence."""
    if samples < 50:
        raise ValueError("samples must be at least 50")
    if epochs < 1:
        raise ValueError("epochs must be at least 1")

    data = make_dataset(seed, samples, features)
    train_set, holdout_set = data.split(holdout)
    model = Model(weights=[0.0] * features, bias=0.0)

    curve: list[float] = []
    rng = random.Random(seed + 1)
    order = list(range(len(train_set.labels)))

    for epoch in range(epochs):
        rng.shuffle(order)
        for start in range(0, len(order), batch_size):
            batch = order[start : start + batch_size]
            grad_w = [0.0] * features
            grad_b = 0.0
            for i in batch:
                row = train_set.features[i]
                err = model.score(row) - train_set.labels[i]
                for j in range(features):
                    grad_w[j] += err * row[j]
                grad_b += err
            scale = learning_rate / max(1, len(batch))
            for j in range(features):
                model.weights[j] -= scale * grad_w[j]
            model.bias -= scale * grad_b
        curve.append(round(log_loss(model, train_set), 4))

    return {
        "accuracy": round(accuracy(model, holdout_set), 4),
        "trainAccuracy": round(accuracy(model, train_set), 4),
        "lossCurve": curve,
        "epochs": epochs,
        "samples": len(train_set.labels),
        "holdoutSamples": len(holdout_set.labels),
        "features": features,
        "weights": [round(w, 4) for w in model.weights],
        "bias": round(model.bias, 4),
    }


def predict(weights: list[float], bias: float, rows: list[list[float]]) -> list[dict]:
    if len(weights) == 0:
        raise ValueError("weights must not be empty")
    model = Model(weights=weights, bias=bias)
    out: list[dict] = []
    for row in rows:
        if len(row) != len(weights):
            raise ValueError(f"expected {len(weights)} features per row, got {len(row)}")
        score = model.score(row)
        out.append({"score": round(score, 4), "label": 1 if score >= 0.5 else 0})
    return out
