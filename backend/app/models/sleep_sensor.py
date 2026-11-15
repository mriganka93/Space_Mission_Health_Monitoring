
from sqlalchemy import Column, Integer, Date, Float
from app.database import Base


class SleepSensorRead(Base):
    __tablename__ = "sleep_sensors_read"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    sleep_hours = Column(Float, nullable=False)
