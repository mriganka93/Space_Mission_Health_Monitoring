from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import engine, Base
from app.models.health_record import HealthRecord
from app.models.lab_result import LabResult  # must be imported before create_all
from app.models.sleep_sensor import SleepSensorRead
from app.routers.health_record import router as health_records_router
from app.routers.lab_result import router as lab_results_router
from app.routers.sleep_sensor import router as sleep_router

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="SpaceHealth API",
    description="Astronaut Health Monitoring System API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (must come after app = FastAPI(...))
app.include_router(health_records_router)
app.include_router(lab_results_router)
app.include_router(sleep_router)  # was imported but never registered


# ---------------------------------------------------------------------------
# Dashboard summary: 2-day averages with warning status
# ---------------------------------------------------------------------------

# Normal ranges. Averages outside these are flagged.
NORMAL_RANGES = {
    "heart_rate": (60, 100),  # BPM
    "spo2": (95, 100),        # percent
}


def _as_utc(dt: datetime) -> datetime:
    """Treat naive timestamps as UTC so they can be compared safely."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _status(field: str, average: float) -> str:
    low, high = NORMAL_RANGES[field]
    if average < low:
        return "low"
    if average > high:
        return "high"
    return "normal"


def _summarize(records, field: str, now: datetime) -> dict:
    """
    Average of `field` over the last 2 days.
    If nothing was recorded in the last 2 days, fall back to the average
    of the most recent day that has data.
    """
    readings = [
        (_as_utc(r.recorded_at), getattr(r, field))
        for r in records
        if r.recorded_at is not None and getattr(r, field) is not None
    ]

    if not readings:
        return {
            "average": None,
            "basis": "no_data",
            "as_of": None,
            "count": 0,
            "status": None,
        }

    window_start = now - timedelta(days=2)
    recent = [value for ts, value in readings if ts >= window_start]

    if recent:
        basis = "last_2_days"
        values = recent
        as_of = now.date().isoformat()
    else:
        latest_ts = max(ts for ts, _ in readings)
        latest_day = latest_ts.date()
        values = [value for ts, value in readings if ts.date() == latest_day]
        basis = "latest_day"
        as_of = latest_day.isoformat()

    raw = sum(values) / len(values)
    average = round(raw) if field == "heart_rate" else round(raw, 1)

    return {
        "average": average,
        "basis": basis,
        "as_of": as_of,
        "count": len(values),
        "status": _status(field, raw),  # status from the unrounded value
    }


def _parse_bp(value):
    """Turn '120/80' into (120.0, 80.0). Returns None if it can't be read."""
    try:
        systolic, diastolic = str(value).split("/")
        return float(systolic), float(diastolic)
    except (ValueError, TypeError):
        return None


def _bp_status(systolic: float, diastolic: float) -> str:
    # Above 130/90 is high, below 90/70 is low.
    if systolic > 130 or diastolic > 90:
        return "high"
    if systolic < 90 or diastolic < 70:
        return "low"
    return "normal"


def _summarize_bp(records, now: datetime) -> dict:
    """Same 2-day logic as _summarize, for 'systolic/diastolic' values."""
    readings = []
    for r in records:
        if r.recorded_at is None or r.blood_pressure is None:
            continue
        parsed = _parse_bp(r.blood_pressure)
        if parsed:
            readings.append((_as_utc(r.recorded_at), parsed[0], parsed[1]))

    if not readings:
        return {
            "average": None,
            "basis": "no_data",
            "as_of": None,
            "count": 0,
            "status": None,
        }

    window_start = now - timedelta(days=2)
    recent = [(s, d) for ts, s, d in readings if ts >= window_start]

    if recent:
        basis = "last_2_days"
        pairs = recent
        as_of = now.date().isoformat()
    else:
        latest_day = max(ts for ts, _, _ in readings).date()
        pairs = [(s, d) for ts, s, d in readings if ts.date() == latest_day]
        basis = "latest_day"
        as_of = latest_day.isoformat()

    raw_sys = sum(s for s, _ in pairs) / len(pairs)
    raw_dia = sum(d for _, d in pairs) / len(pairs)

    return {
        "average": f"{round(raw_sys)}/{round(raw_dia)}",
        "basis": basis,
        "as_of": as_of,
        "count": len(pairs),
        "status": _bp_status(raw_sys, raw_dia),
    }


@app.get("/health-summary")
def health_summary(mission_type: Optional[str] = None):
    now = datetime.now(timezone.utc)

    with Session(engine) as db:
        query = db.query(HealthRecord)
        if mission_type:
            query = query.filter(HealthRecord.mission_type == mission_type)
        records = query.order_by(HealthRecord.recorded_at.desc()).all()

        return {
            "heart_rate": _summarize(records, "heart_rate", now),
            "spo2": _summarize(records, "spo2", now),
            "blood_pressure": _summarize_bp(records, now),
        }


# ---------------------------------------------------------------------------
# Sleep summary: 7-day average, green if >= 6 hrs, red if below
# ---------------------------------------------------------------------------

# Attribute names on SleepSensorRead. Change these if your model differs.
# Attribute names on SleepSensorRead
SLEEP_TIME_ATTR = "date"
SLEEP_HOURS_ATTR = "sleep_hours"
SLEEP_MIN_HOURS = 6


@app.get("/sleep-summary")
def sleep_summary():
    time_col = getattr(SleepSensorRead, SLEEP_TIME_ATTR)
    hours_col = getattr(SleepSensorRead, SLEEP_HOURS_ATTR)

    # The column is a Date, so compare against a date, not a datetime.
    since = (datetime.now(timezone.utc) - timedelta(days=7)).date()

    with Session(engine) as db:
        avg, count = (
            db.query(func.avg(hours_col), func.count(hours_col))
            .filter(time_col >= since)
            .one()
        )

    if not count:
        return {"average": None, "basis": "no_data", "count": 0, "status": None}

    raw = float(avg)
    return {
        "average": round(raw, 1),
        "basis": "last_7_days",
        "count": count,
        "status": "low" if raw < SLEEP_MIN_HOURS else "normal",
    }

@app.get("/")
def home():
    return {
        "message": "SpaceHealth Backend is running!",
        "status": "online"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "SQLite"
    }