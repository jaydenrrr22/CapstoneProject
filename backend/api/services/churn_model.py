from __future__ import annotations

import math
import pickle
from functools import lru_cache
from pathlib import Path

import pandas as pd

GENDER_MAPPING = {
    "female": 1,
    "male": 0,
}

SUBSCRIPTION_TYPE_MAPPING = {
    "standard": 0,
    "premium": 1,
    "basic": 2,
}

CONTRACT_LENGTH_MAPPING = {
    "annual": 0,
    "quarterly": 1,
    "monthly": 2,
}

MODEL_COLUMNS = [
    "Age",
    "Gender",
    "Tenure",
    "Usage Frequency",
    "Support Calls",
    "Payment Delay",
    "Subscription Type",
    "Contract Length",
    "Total Spend",
    "Last Interaction",
]


def _normalize_choice(value: str) -> str:
    return str(value).strip().lower()


def _map_required_value(value: str, mapping: dict[str, int], field_name: str) -> int:
    normalized_value = _normalize_choice(value)

    if normalized_value not in mapping:
        raise ValueError(f"Unsupported {field_name}: {value}")

    return mapping[normalized_value]


def _build_prediction_frame(data: dict) -> pd.DataFrame:
    row = {
        "Age": float(data["age"]),
        "Gender": _map_required_value(data["gender"], GENDER_MAPPING, "gender"),
        "Tenure": float(data["months_subscribed"]),
        "Usage Frequency": float(data["usage_frequency"]),
        "Support Calls": float(data["support_calls"]),
        "Payment Delay": float(data["payment_delays"]),
        "Subscription Type": _map_required_value(
            data["subscription_type"],
            SUBSCRIPTION_TYPE_MAPPING,
            "subscription_type",
        ),
        "Contract Length": _map_required_value(
            data["contract_length"],
            CONTRACT_LENGTH_MAPPING,
            "contract_length",
        ),
        "Total Spend": float(data["total_spend"]),
        "Last Interaction": float(data["days_since_last_interaction"]),
    }

    return pd.DataFrame([row], columns=MODEL_COLUMNS)


@lru_cache(maxsize=1)
def _load_trained_model():
    project_root = Path(__file__).resolve().parents[3]
    candidate_paths = [
        project_root / "data_analysis" / "churn_model.pkl",
        project_root / "backend" / "api" / "services" / "churn_model.pkl",
        project_root / "backend" / "models" / "churn_model.pkl",
    ]

    for path in candidate_paths:
        if path.exists():
            print(f"Loading churn model from: {path}")
            with path.open("rb") as model_file:
                return pickle.load(model_file)

    return None


def _simulate_churn_risk(frame: pd.DataFrame) -> float:
    row = frame.iloc[0]

    weighted_score = (
        row["Support Calls"] * 0.20
        + row["Payment Delay"] * 0.28
        + row["Last Interaction"] * 0.08
        + row["Tenure"] * 0.01
        + row["Total Spend"] * 0.002
        + row["Subscription Type"] * 0.7
        + row["Contract Length"] * 0.9
        + row["Gender"] * 0.15
        - row["Usage Frequency"] * 0.16
        - row["Age"] * 0.02
        - 4.0
    )
    probability = 1 / (1 + math.exp(-weighted_score))

    return round(max(0.0, min(100.0, probability * 100)), 2)


def predict_churn_from_input(data: dict) -> float:
    prediction_frame = _build_prediction_frame(data)
    model = _load_trained_model()

    if model is None:
        return _simulate_churn_risk(prediction_frame)

    if hasattr(model, "predict_proba"):
        probability = float(model.predict_proba(prediction_frame)[0][1])
        return round(max(0.0, min(100.0, probability * 100)), 2)

    prediction = float(model.predict(prediction_frame)[0])
    return round(max(0.0, min(100.0, prediction * 100)), 2)
