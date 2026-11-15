
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sleep_sensor import SleepSensorRead

router = APIRouter(
    prefix="/sleep-records",
    tags=["Sleep Records"]
)


@router.get("/")
def get_sleep_records(db: Session = Depends(get_db)):
    records = (
        db.query(SleepSensorRead)
        .order_by(SleepSensorRead.date.desc())
        .all()
    )

    return [
        {
            "id": record.id,
            "date": record.date.isoformat(),
            "sleep_hours": record.sleep_hours
        }
        for record in records
    ]
