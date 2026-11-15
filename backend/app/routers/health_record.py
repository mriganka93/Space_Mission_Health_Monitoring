
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.health_record import HealthRecord
from app.schemas.health_record import (
    HealthRecordCreate,
    HealthRecordResponse
)

router = APIRouter(
    prefix="/health-records",
    tags=["Health Records"]
)


# POST: Save a new health record to SQLite
@router.post("/", response_model=HealthRecordResponse, status_code=201)
def create_health_record(
    record: HealthRecordCreate,
    db: Session = Depends(get_db)
):
    try:
        db_record = HealthRecord(
            mission_type=record.mission_type,
            blood_pressure=record.blood_pressure,
            heart_rate=record.heart_rate,
            spo2=record.spo2,
            temperature=record.temperature,
            weight=record.weight,
            notes=record.notes
        )

        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        return db_record

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save health record: {str(e)}"
        )


# GET: Retrieve all health records
@router.get("/", response_model=List[HealthRecordResponse])
def get_health_records(
    mission_type: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(HealthRecord)

    if mission_type:
        if mission_type not in ["flight", "mars"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid mission type"
            )

        query = query.filter(
            HealthRecord.mission_type == mission_type
        )

    return query.order_by(
        HealthRecord.recorded_at.desc()
    ).all()


# GET: Retrieve the latest health record
@router.get("/latest", response_model=HealthRecordResponse)
def get_latest_health_record(
    mission_type: str,
    db: Session = Depends(get_db)
):
    if mission_type not in ["flight", "mars"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid mission type"
        )

    record = (
        db.query(HealthRecord)
        .filter(HealthRecord.mission_type == mission_type)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="No health records found"
        )

    return record
