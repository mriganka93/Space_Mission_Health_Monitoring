import io
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import engine
from app.models.lab_result import LabResult

router = APIRouter(prefix="/lab-results", tags=["lab-results"])

# Columns the uploaded file must contain (order doesn't matter).
REQUIRED_COLUMNS = {"date", "sample_type", "test_name", "value", "unit"}


@router.post("/upload")
async def upload_lab_results(
    mission_type: str = Form(...),
    file: UploadFile = File(...),
):
    content = await file.read()
    filename = (file.filename or "").lower()

    # 1. Read the file into a table.
    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding="latin-1")
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(
                status_code=400, detail="Upload a .csv, .xlsx or .xls file."
            )
    except HTTPException:
        raise
    except ImportError as error:
        raise HTTPException(
            status_code=400, detail=f"A required package is missing: {error}"
        )
    except Exception as error:
        raise HTTPException(
            status_code=400, detail=f"Could not read the file: {error}"
        )

    # 2. Check the columns.
    df.columns = [str(c).strip().lower() for c in df.columns]
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {', '.join(sorted(missing))}",
        )

    # 3. Turn each row into a database record, skipping bad rows.
    rows, skipped = [], 0
    for _, r in df.iterrows():
        try:
            measured_at = pd.to_datetime(r["date"])
            value = float(r["value"])
            if pd.isna(measured_at) or pd.isna(value):
                raise ValueError("empty date or value")

            rows.append(
                LabResult(
                    mission_type=mission_type,
                    sample_type=str(r["sample_type"]).strip().lower(),
                    test_name=str(r["test_name"]).strip(),
                    value=value,
                    unit=str(r["unit"]).strip(),
                    measured_at=measured_at.to_pydatetime(),
                )
            )
        except (ValueError, TypeError):
            skipped += 1

    if not rows:
        raise HTTPException(status_code=400, detail="No valid rows found in the file.")

    # 4. Save everything in one commit.
    with Session(engine) as db:
        db.add_all(rows)
        db.commit()

    return {"saved": len(rows), "skipped": skipped}


@router.get("/")
def list_lab_results(mission_type: Optional[str] = None):
    with Session(engine) as db:
        query = db.query(LabResult)
        if mission_type:
            query = query.filter(LabResult.mission_type == mission_type)

        results = query.order_by(LabResult.measured_at.desc()).all()

        return [
            {
                "id": r.id,
                "mission_type": r.mission_type,
                "sample_type": r.sample_type,
                "test_name": r.test_name,
                "value": r.value,
                "unit": r.unit,
                "measured_at": r.measured_at.isoformat() if r.measured_at else None,
            }
            for r in results
        ]
