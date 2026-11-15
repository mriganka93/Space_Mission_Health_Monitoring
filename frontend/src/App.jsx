import { useState, useEffect } from "react";
import {
  Rocket, Globe2, Activity, HeartPulse, Brain,
  Moon, Upload, FileText, LayoutDashboard,
  ArrowLeft, Radiation, ShieldCheck, LogOut,
  ClipboardList, Thermometer, PlusCircle
} from "lucide-react";

import HealthLog from "./assets/health_log";
import DataUpload from "./assets/data_upload";
import Analytics from "./assets/Analytics";
import "./index.css";

const API_URL = "http://127.0.0.1:8000";

const missions = {
  flight: {
    title: "Space Flight Health Dashboard",
    subtitle: "Monitoring astronaut wellness during interplanetary transit",
    icon: Rocket,
    color: "#319CE0",
    modules: [
      { name: "Cardiovascular Health", icon: HeartPulse, desc: "Heart rate and blood pressure" },
      { name: "Respiratory Health", icon: Activity, desc: "Oxygen saturation and breathing" },
      { name: "Sleep Monitoring", icon: Moon, desc: "Sleep duration and quality" },
      { name: "Mental Wellness", icon: Brain, desc: "Stress and mood tracking" },
      { name: "Physical Activity", icon: Activity, desc: "Exercise and fatigue records" },
      { name: "Health Records", icon: ClipboardList, desc: "Daily health observations" },
      { name: "Data Import", icon: Upload, desc: "Upload astronaut Excel records" },
      { name: "Health Reports", icon: FileText, desc: "Historical health analytics" }
    ]
  },
  mars: {
    title: "Mars Surface Health Dashboard",
    subtitle: "Monitoring astronaut wellness on the Martian surface",
    icon: Globe2,
    color: "#D77B50",
    modules: [
      { name: "Cardiovascular Health", icon: HeartPulse, desc: "Heart rate and blood pressure" },
      { name: "Respiratory Health", icon: Activity, desc: "Oxygen saturation and breathing" },
      { name: "Radiation Exposure", icon: Radiation, desc: "Recorded radiation exposure" },
      { name: "Environmental Health", icon: Thermometer, desc: "Temperature and environmental records" },
      { name: "Mental Wellness", icon: Brain, desc: "Stress and mood tracking" },
      { name: "Physical Activity", icon: Activity, desc: "Exercise and fatigue records" },
      { name: "Data Import", icon: Upload, desc: "Upload astronaut Excel records" },
      { name: "Health Reports", icon: FileText, desc: "Historical health analytics" }
    ]
  }
};

function MissionSelection({ onSelect }) {
  return (
    <main className="selection-page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Rocket size={23}/></div>
          <div>
            <h2>MARS MISSION</h2>
            <span>HEALTH MONITOR</span>
          </div>
        </div>
        <span className="system-status">
          <span className="status-dot"/> SYSTEM ONLINE
        </span>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">HUMAN SPACEFLIGHT HEALTH SYSTEM</span>
          <h1>Every Mission.<br/>
            <span>Every Astronaut.</span><br/>
            Every Heartbeat.
          </h1>
          <p>
            Your mission health companion. Monitor astronaut
            wellness, record vital signs, and track health
            throughout the journey to Mars.
          </p>
        </div>
        <div className="planet-art">
          <div className="orbit orbit-one"/>
          <div className="orbit orbit-two"/>
          <div className="planet"/>
          <div className="planet-glow"/>
          <span className="planet-label">MARS // 01</span>
        </div>
      </section>

      <section className="mission-choice">
        <div className="choice-heading">
          <span className="eyebrow">MISSION CONFIGURATION</span>
          <h2>Where are you currently located?</h2>
          <p>Select your mission environment to continue.</p>
        </div>

        <div className="mission-cards">
          <button
            className="mission-card flight-card"
            onClick={() => onSelect("flight")}
          >
            <div className="card-visual flight-visual">
              <Rocket size={55}/>
              <span className="visual-tag">PHASE 01</span>
            </div>
            <div className="card-content">
              <span className="card-label">INTERPLANETARY TRANSIT</span>
              <h3>Space Flight</h3>
              <p>
                I am currently travelling to Mars aboard
                a spacecraft.
              </p>
              <span className="card-action">
                ENTER SPACE FLIGHT <span>→</span>
              </span>
            </div>
          </button>

          <button
            className="mission-card mars-card"
            onClick={() => onSelect("mars")}
          >
            <div className="card-visual mars-visual">
              <Globe2 size={55}/>
              <span className="visual-tag">PHASE 02</span>
            </div>
            <div className="card-content">
              <span className="card-label">MARTIAN OPERATIONS</span>
              <h3>At Mars</h3>
              <p>
                I have landed on Mars and am operating
                on the Martian surface.
              </p>
              <span className="card-action">
                ENTER MARS BASE <span>→</span>
              </span>
            </div>
          </button>
        </div>
      </section>

      <footer className="footer">
        <span>MARS MISSION HEALTH MONITOR</span>
        <span>ASTRONAUT WELLNESS & MISSION SUPPORT</span>
      </footer>
    </main>
  );
}

const WARNING_TEXT = {
  heart_rate: { low: "HR too low", high: "HR too high" },
  spo2: { low: "SpO2 too low", high: "SpO2 too high - check sensor" },
  blood_pressure: { low: "BP too low", high: "BP too high" }
};

function describeSummary(info) {
  if (!info || info.average == null) return "No data submitted";

  if (info.basis === "last_2_days") {
    return `Average of last 2 days (${info.count} reading${info.count === 1 ? "" : "s"})`;
  }

  return `No data in last 2 days. Average of ${info.as_of}`;
}

function VitalWarning({ field, info }) {
  if (!info || !info.status || info.status === "normal") return null;

  const text = WARNING_TEXT[field]?.[info.status];
  if (!text) return null;

  return (
    <p style={{ color: "#E5484D", fontWeight: 600, margin: "6px 0 0" }}>
      {text}
    </p>
  );
}

// Sleep: 7-day average from the backend. Below 6 hrs = red, otherwise green.
function describeSleep(info) {
  if (!info || info.average == null) return "No data submitted";
  return `Average of last 7 days (${info.count} reading${info.count === 1 ? "" : "s"})`;
}

function SleepStatus({ info }) {
  if (!info || !info.status) return null;

  const isLow = info.status === "low";

  return (
    <p
      style={{
        color: isLow ? "#E5484D" : "#26A88A",
        fontWeight: 600,
        margin: "6px 0 0"
      }}
    >
      {isLow ? "Sleep too low (below 6 hrs)" : "Sleep is healthy"}
    </p>
  );
}

function Dashboard({ type, onBack }) {
  const mission = missions[type];
  const MissionIcon = mission.icon;

  const [activeModule, setActiveModule] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [summary, setSummary] = useState(null);
  const [sleepSummary, setSleepSummary] = useState(null);

  // Load the 2-day averages. Refreshes whenever a record is added.
  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const response = await fetch(
          `${API_URL}/health-summary?mission_type=${type}`
        );

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) setSummary(data);
      } catch (error) {
        console.error("Could not load summary:", error);
        if (!cancelled) setSummary(null);
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [type, records.length]);

  // Load the 7-day sleep average from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadSleepSummary() {
      try {
        const response = await fetch(`${API_URL}/sleep-summary`);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) setSleepSummary(data);
      } catch (error) {
        console.error("Could not load sleep summary:", error);
        if (!cancelled) setSleepSummary(null);
      }
    }

    loadSleepSummary();

    return () => {
      cancelled = true;
    };
  }, [type]);

  // Load saved records from the backend when the dashboard opens.
  // NOTE: adjust this URL if your GET endpoint is different.
  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const response = await fetch(
          `${API_URL}/health-records/?mission_type=${type}`
        );

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled && Array.isArray(data)) {
          // Newest first, so records[0] is always the latest reading.
          const sorted = [...data].sort(
            (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
          );
          setRecords(sorted);
          setLoadError("");
        }
      } catch (error) {
        console.error("Could not load records:", error);
        if (!cancelled) {
          setLoadError("Could not load saved records from the server.");
        }
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [type]);

  // Save a new health measurement to the backend.
  async function saveHealthRecord(record) {
    const response = await fetch(`${API_URL}/health-records/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mission_type: type,
        blood_pressure: record.bloodPressure,
        heart_rate: record.heartRate,
        spo2: record.spo2,
        temperature: record.temperature,
        weight: record.weight,
        notes: record.notes
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Non-JSON error body (e.g. an HTML 500 page)
    }

    if (!response.ok) {
      console.error("Backend error:", data);
      throw new Error(
        typeof data?.detail === "string"
          ? data.detail
          : data?.detail
            ? JSON.stringify(data.detail)
            : `Failed to save record (${response.status})`
      );
    }

    // Update dashboard immediately.
    setRecords((previous) => [data, ...previous]);

    return data;
  }

  const backToDashboard = (
    <button
      className="back-button"
      onClick={() => setActiveModule(null)}
    >
      <ArrowLeft size={16}/>
      Back to dashboard
    </button>
  );

  return (
    <div className="dashboard">

      <aside className="sidebar">

        <div className="sidebar-brand">
          <Rocket size={25}/>
          <div>
            <strong>SPACEHEALTH</strong>
            <small>MISSION SYSTEM</small>
          </div>
        </div>

        <div className="mission-badge">
          <MissionIcon size={18}/>
          <span>
            {type === "flight" ? "SPACE FLIGHT" : "MARS SURFACE"}
          </span>
        </div>

        <p className="nav-label">MAIN MENU</p>

        <button
          className={`nav-item ${!activeModule ? "active" : ""}`}
          onClick={() => setActiveModule(null)}
        >
          <LayoutDashboard size={18}/>
          Dashboard
        </button>

        <button
          className={`nav-item ${activeModule === "Manual Entry" ? "active" : ""}`}
          onClick={() => setActiveModule("Manual Entry")}
        >
          <PlusCircle size={18}/>
          Manual Entry
        </button>

        <button
          className={`nav-item ${activeModule === "Health Records" ? "active" : ""}`}
          onClick={() => setActiveModule("Health Records")}
        >
          <ClipboardList size={18}/>
          Health Records
        </button>

        <button
          className={`nav-item ${activeModule === "Data Import" ? "active" : ""}`}
          onClick={() => setActiveModule("Data Import")}
        >
          <Upload size={18}/>
          Blood/Urine Data Upload
        </button>

        <button
          className={`nav-item ${activeModule === "Health Reports" ? "active" : ""}`}
          onClick={() => setActiveModule("Health Reports")}
        >
          <FileText size={18}/>
          Analytics & Reports
        </button>

        <div className="sidebar-bottom">
          <ShieldCheck size={19}/>
          <span>Health data management</span>

          <button onClick={onBack} className="back-button">
            <LogOut size={17}/>
            Change Mission
          </button>
        </div>

      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <span className="eyebrow">MISSION HEALTH CENTER</span>
            <h1>{mission.title}</h1>
            <p>{mission.subtitle}</p>
          </div>
          <div className="avatar">AS</div>
        </header>

        {activeModule === "Manual Entry" ? (

          <section className="module-placeholder">
            {backToDashboard}
            <HealthLog onSave={saveHealthRecord}/>
          </section>

        ) : activeModule === "Health Records" ? (

          <section className="module-placeholder">
            {backToDashboard}

            <h2>Health Records</h2>

            <p>
              {records.length} manual health record(s) available.
            </p>

            {loadError && <p>{loadError}</p>}

            {records.length === 0 ? (
              <p>No health records submitted yet.</p>
            ) : (
              <div className="stats-grid">
                {records.map((record) => (
                  <div className="stat-card" key={record.id}>

                    <span>
                      {new Date(record.recorded_at).toLocaleString()}
                    </span>

                    <strong>
                      {record.heart_rate} <small>BPM</small>
                    </strong>

                    <small>Heart Rate</small>

                    <p>BP: {record.blood_pressure} mmHg</p>

                    <p>SpO2: {record.spo2}%</p>

                    <p>Temperature: {record.temperature} °C</p>

                    <p>
                      Weight: {record.weight == null
                        ? "Not recorded"
                        : `${record.weight} kg`}
                    </p>

                    {record.notes && (
                      <p>Notes: {record.notes}</p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </section>

        ) : activeModule === "Health Reports" ? (

          <section className="module-placeholder">
            {backToDashboard}
            <Analytics records={records} type={type}/>
          </section>

        ) : activeModule === "Data Import" ? (

          <section className="module-placeholder">
            {backToDashboard}
            <DataUpload type={type}/>
          </section>

        ) : activeModule ? (

          // Any other module card (Sleep, Radiation, Reports, etc.)
          <section className="module-placeholder">
            {backToDashboard}
            <h2>{activeModule}</h2>
            <p>This module is coming soon.</p>
          </section>

        ) : (

          <>
            <div className="welcome-banner">
              <div>
                <span>MISSION ENVIRONMENT</span>
                <h2>
                  {type === "flight" ? "Journey to Mars" : "Welcome to Mars"}
                </h2>
                <p>
                  Your astronaut health monitoring workspace is ready.
                </p>
              </div>
              <MissionIcon size={65}/>
            </div>

            <h2 className="section-title">Health Overview</h2>

            <div className="stats-grid">

              <div className="stat-card">
                <HeartPulse color="#329FE1"/>
                <span>HEART RATE</span>
                <strong>
                  {summary?.heart_rate?.average ?? "--"}
                  <small> BPM</small>
                </strong>
                <VitalWarning field="heart_rate" info={summary?.heart_rate}/>
                <small>{describeSummary(summary?.heart_rate)}</small>
              </div>

              <div className="stat-card">
                <Activity color="#26A88A"/>
                <span>OXYGEN LEVEL</span>
                <strong>
                  {summary?.spo2?.average ?? "--"}
                  <small>%</small>
                </strong>
                <VitalWarning field="spo2" info={summary?.spo2}/>
                <small>{describeSummary(summary?.spo2)}</small>
              </div>

              <div className="stat-card">
                <Moon color="#8A79CF"/>
                <span>SLEEP DURATION</span>
                <strong>
                  {sleepSummary?.average ?? "--"}
                  <small> HRS</small>
                </strong>
                <SleepStatus info={sleepSummary}/>
                <small>{describeSleep(sleepSummary)}</small>
              </div>

              <div className="stat-card">
                <HeartPulse color="#D99B49"/>
                <span>BLOOD PRESSURE</span>
                <strong>
                  {summary?.blood_pressure?.average ?? "--"}
                  <small> mmHg</small>
                </strong>
                <VitalWarning field="blood_pressure" info={summary?.blood_pressure}/>
                <small>{describeSummary(summary?.blood_pressure)}</small>
              </div>

            </div>

            <h2 className="section-title">Mission Health Modules</h2>

            <div className="modules-grid">
              {mission.modules.map((module) => {
                const Icon = module.icon;

                return (
                  <button
                    className="module-card"
                    key={module.name}
                    onClick={() => setActiveModule(module.name)}
                  >
                    <div className="module-icon">
                      <Icon size={23}/>
                    </div>

                    <h3>{module.name}</h3>
                    <p>{module.desc}</p>
                    <span>OPEN MODULE →</span>
                  </button>
                );
              })}
            </div>
          </>

        )}

      </main>
    </div>
  );
}

export default function App() {
  // Only accept a stored mission if it is a known one.
  const [mission, setMission] = useState(() => {
    const saved = sessionStorage.getItem("mission");
    return missions[saved] ? saved : null;
  });

  function selectMission(type) {
    sessionStorage.setItem("mission", type);
    setMission(type);
  }

  function changeMission() {
    sessionStorage.removeItem("mission");
    setMission(null);
  }

  return mission ? (
    <Dashboard key={mission} type={mission} onBack={changeMission}/>
  ) : (
    <MissionSelection onSelect={selectMission}/>
  );
}