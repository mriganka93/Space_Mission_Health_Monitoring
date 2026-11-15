
from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from datetime import datetime, timezone

from app.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)

    # Mission information
    mission_type = Column(String(50), nullable=False)

    # Health measurements
    blood_pressure = Column(String(20), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    spo2 = Column(Integer, nullable=False)
    temperature = Column(Float, nullable=False)
    weight = Column(Float, nullable=True)

    # Astronaut observations
    notes = Column(Text, nullable=True)

    # Timestamp
    recorded_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
