from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database import Base


class LabResult(Base):
    """One row per test result from an uploaded blood/urine file."""

    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    mission_type = Column(String, index=True)   # "flight" or "mars"
    sample_type = Column(String)                # "blood" or "urine"
    test_name = Column(String)                  # e.g. "hemoglobin"
    value = Column(Float)
    unit = Column(String)                       # e.g. "g/dL"
    measured_at = Column(DateTime)              # date from the file
    uploaded_at = Column(DateTime, default=datetime.utcnow)