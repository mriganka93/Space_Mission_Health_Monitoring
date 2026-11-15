
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class HealthRecordCreate(BaseModel):
    mission_type: str = Field(..., pattern="^(flight|mars)$")

    blood_pressure: str = Field(
        ...,
        pattern=r"^\d{2,3}/\d{2,3}$"
    )

    heart_rate: int = Field(..., ge=1, le=300)

    spo2: int = Field(..., ge=0, le=100)

    temperature: float = Field(..., ge=25, le=45)

    weight: Optional[float] = Field(
        default=None,
        ge=1,
        le=500
    )

    notes: Optional[str] = Field(
        default=None,
        max_length=1000
    )


class HealthRecordResponse(BaseModel):
    id: int
    mission_type: str
    blood_pressure: str
    heart_rate: int
    spo2: int
    temperature: float
    weight: Optional[float]
    notes: Optional[str]
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
