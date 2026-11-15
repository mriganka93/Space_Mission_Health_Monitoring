# SpaceHealth: Astronaut Health Monitoring System

Built for the **NASA Space Apps Challenge 2026**, challenge: *Create Health
Monitoring Software for Astronauts on Space Missions*.

SpaceHealth helps astronauts and mission support track wellness across both
phases of a Mars mission: the interplanetary flight and life on the Martian
surface. Astronauts pick their mission environment and get a dashboard built
for it.

## Features

- **Mission-aware dashboard** for Space Flight and Mars Surface, with
  separate records for each.
- **Manual health entry** for blood pressure, heart rate, SpO2, temperature,
  weight and notes.
- **Automatic warnings** that flag heart rate, oxygen level and blood pressure
  averages outside the normal range, using the last 2 days of readings.
- **Sleep monitoring** with a 7-day average: green at 6 hours or more, a red
  warning below that.
- **Analytics and reports**, including a 30-day blood pressure chart with
  out-of-range readings highlighted.
- **Lab data upload** (blood and urine results) with colour-coded cards for
  glucose, calcium and creatinine, plus plain-language guidance.

## Tech stack

- **Frontend:** React, Vite, Lucide icons
- **Backend:** FastAPI, SQLAlchemy
- **Database:** SQLite

## Running locally

Backend:

    cd backend
    source venv/bin/activate
    uvicorn app.main:app --reload

Frontend:

    cd frontend
    npm install
    npm run dev

Open the address Vite prints (usually http://localhost:5173). The API
documentation is at http://127.0.0.1:8000/docs.

## Disclaimer

The normal ranges and health tips are demonstration guidance, not medical
advice. Real limits for a mission would be set by flight surgeons.
