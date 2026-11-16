🚀 SpaceHealth: Astronaut Health Monitoring System

Built for the NASA Space Apps Challenge 2026, challenge: Create Health Monitoring Software for Astronauts on Space Missions.

SpaceHealth is an astronaut health monitoring platform designed to help astronauts and mission support teams track, monitor, and analyse health conditions throughout a Mars mission. It supports two mission environments: Space Flight and Mars Surface, providing separate health records and environment-specific dashboards.

✨ Features
Mission-aware Dashboard: Separate dashboards and health records for Space Flight and Mars Surface missions.
Manual Health Monitoring: Record blood pressure, heart rate, SpO2, body temperature, weight, and personal health notes.
Automatic Health Alerts: Identifies abnormal heart rate, oxygen saturation, and blood pressure averages based on the last 2 days of readings.
Sleep Monitoring: Tracks sleep patterns using a 7-day average, with visual alerts for insufficient sleep.
Health Analytics & Reports: Provides health trends and a 30-day blood pressure chart with out-of-range readings highlighted.
Laboratory Data Upload: Supports blood and urine test results with colour-coded indicators for glucose, calcium, and creatinine, along with plain-language guidance.
🖥️ Application Screenshots

The following screenshots demonstrate the main features and user interface of SpaceHealth.

1. Dashboard

!SpaceHealth Dashboard

2. Health Monitoring

!Health Monitoring

3. Sleep Monitoring

!Sleep Monitoring

4. Analytics and Reports

!Analytics and Reports

5. Laboratory Results

!Laboratory Results

6. Mission Environment Selection

!Mission Environment

🛠️ Tech Stack
Component	Technology
Frontend	React, Vite, Lucide Icons
Backend	Python, FastAPI, SQLAlchemy
Database	SQLite
📂 Project Structure
text
spacehealth/
├── backend/
│   ├── app/
│   ├── uploads/
│   ├── venv/
│   ├── health_records.db
│   └── requirements.txt
├── frontend/
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── health-monitoring.png
│       ├── sleep-monitoring.png
│       ├── reports.png
│       ├── lab-results.png
│       └── mission-selection.png
├── README.md
└── .gitignore

⚙️ Running Locally
Prerequisites
Python 3
Node.js and npm
1. Clone the Repository
bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd spacehealth

2. Start the Backend
bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload


Backend API: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

3. Start the Frontend

Open a new terminal:

bash
cd frontend
npm install
npm run dev


Open the local address provided by Vite (usually http://localhost:5173).

🌍 Project Goal

SpaceHealth aims to support astronaut health monitoring during long-duration space missions by making health information accessible, organised, and easier to understand for both astronauts and mission support teams.

⚠️ Disclaimer

The normal health ranges, automated alerts, and health recommendations provided by this application are intended for demonstration purposes only and do not constitute medical advice. Actual medical thresholds and interventions for space missions must be determined by qualified flight surgeons and healthcare professionals.
