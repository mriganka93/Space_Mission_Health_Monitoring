import { useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const DAY = 24 * 60 * 60 * 1000;
const W = 760;
const H = 340;
const M = { top: 22, right: 24, bottom: 46, left: 52 };

const SYS_COLOR = "#D99B49";
const DIA_COLOR = "#329FE1";
const ALERT_COLOR = "#E5484D";

// Same limits the dashboard warnings use.
const sysOut = (v) => v > 130 || v < 90;
const diaOut = (v) => v > 90 || v < 70;

function parseTime(value) {
  if (!value) return NaN;
  const text = String(value);
  // The backend stores UTC without a zone marker, so add one.
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasZone ? text : `${text}Z`).getTime();
}

function parseBP(value) {
  const parts = String(value ?? "").split("/");
  if (parts.length !== 2 || parts.some((p) => p.trim() === "")) return null;
  const sys = Number(parts[0]);
  const dia = Number(parts[1]);
  if (!Number.isFinite(sys) || !Number.isFinite(dia)) return null;
  return { sys, dia };
}

function BloodPressureChart({ records }) {
  const { points, start, end } = useMemo(() => {
    const end = Date.now();
    const start = end - 30 * DAY;

    const points = records
      .map((r) => {
        const bp = parseBP(r.blood_pressure);
        const t = parseTime(r.recorded_at);
        return bp && Number.isFinite(t) ? { t, ...bp } : null;
      })
      .filter((p) => p && p.t >= start && p.t <= end)
      .sort((a, b) => a.t - b.t);

    return { points, start, end };
  }, [records]);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const yMin = Math.floor((Math.min(60, ...points.map((p) => p.dia)) - 5) / 20) * 20;
  const yMax = Math.ceil((Math.max(140, ...points.map((p) => p.sys)) + 5) / 20) * 20;

  const x = (t) => M.left + ((t - start) / (end - start)) * plotW;
  const y = (v) => M.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const yTicks = [];
  for (let v = yMin; v <= yMax; v += 20) yTicks.push(v);

  // A label every 5 days across the 30-day window.
  const xTicks = Array.from({ length: 7 }, (_, i) => start + i * 5 * DAY);

  const linePath = (key) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");

  const avgSys = points.length
    ? Math.round(points.reduce((s, p) => s + p.sys, 0) / points.length)
    : null;
  const avgDia = points.length
    ? Math.round(points.reduce((s, p) => s + p.dia, 0) / points.length)
    : null;
  const outOfRange = points.filter((p) => sysOut(p.sys) || diaOut(p.dia)).length;

  const shortDate = (t) =>
    new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div style={{ maxWidth: 880 }}>
      <h2 className="section-title">Blood pressure, last 30 days</h2>

      <p style={{ opacity: 0.75, marginTop: 0 }}>
        {points.length === 0
          ? "No blood pressure readings in the last 30 days."
          : `${points.length} reading${points.length === 1 ? "" : "s"}, average ${avgSys}/${avgDia} mmHg` +
            (outOfRange ? `, ${outOfRange} outside the normal range.` : ", all within the normal range.")}
      </p>

      <div
        style={{
          border: "1px solid rgba(127,127,127,.3)",
          borderRadius: 16,
          padding: "16px 16px 8px"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13, marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 18, height: 3, background: SYS_COLOR, borderRadius: 2 }}/>
            Systolic
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 18, height: 3, background: DIA_COLOR, borderRadius: 2 }}/>
            Diastolic
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span
              style={{
                width: 11, height: 11, borderRadius: "50%",
                border: `2px solid ${ALERT_COLOR}`
              }}
            />
            Outside normal range
          </span>
        </div>

        {points.length === 0 ? (
          <p style={{ opacity: 0.7, padding: "40px 0", textAlign: "center" }}>
            Save a manual entry with a blood pressure and it will appear here.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            role="img"
            aria-label="Line chart of systolic and diastolic blood pressure over the last 30 days"
            style={{ display: "block" }}
          >
            {/* Grid and y axis */}
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)}
                  stroke="currentColor" strokeOpacity="0.12"
                />
                <text
                  x={M.left - 10} y={y(v) + 4} textAnchor="end"
                  fontSize="12" fill="currentColor" fillOpacity="0.65"
                >
                  {v}
                </text>
              </g>
            ))}
            <text x={M.left - 10} y={12} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.55">
              mmHg
            </text>

            {/* x axis */}
            {xTicks.map((t) => (
              <text
                key={t} x={x(t)} y={H - M.bottom + 22} textAnchor="middle"
                fontSize="12" fill="currentColor" fillOpacity="0.65"
              >
                {shortDate(t)}
              </text>
            ))}
            <line
              x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom}
              stroke="currentColor" strokeOpacity="0.3"
            />

            {/* Lines */}
            <path d={linePath("sys")} fill="none" stroke={SYS_COLOR} strokeWidth="2.5" strokeLinejoin="round"/>
            <path d={linePath("dia")} fill="none" stroke={DIA_COLOR} strokeWidth="2.5" strokeLinejoin="round"/>

            {/* Points, alert rings and hover text */}
            {points.map((p) => {
              const when = new Date(p.t).toLocaleString(undefined, {
                day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
              });

              return (
                <g key={p.t}>
                  <circle cx={x(p.t)} cy={y(p.sys)} r="3.5" fill={SYS_COLOR}/>
                  <circle cx={x(p.t)} cy={y(p.dia)} r="3.5" fill={DIA_COLOR}/>

                  {sysOut(p.sys) && (
                    <circle cx={x(p.t)} cy={y(p.sys)} r="8" fill="none" stroke={ALERT_COLOR} strokeWidth="2"/>
                  )}
                  {diaOut(p.dia) && (
                    <circle cx={x(p.t)} cy={y(p.dia)} r="8" fill="none" stroke={ALERT_COLOR} strokeWidth="2"/>
                  )}

                  <circle cx={x(p.t)} cy={y(p.sys)} r="10" fill="transparent">
                    <title>{`${when}: ${p.sys}/${p.dia} mmHg`}</title>
                  </circle>
                  <circle cx={x(p.t)} cy={y(p.dia)} r="10" fill="transparent">
                    <title>{`${when}: ${p.sys}/${p.dia} mmHg`}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lab marker cards: latest value from the uploaded lab files
// ---------------------------------------------------------------------------

const LEVEL_COLOR = { green: "#26A88A", yellow: "#E5B83D", red: "#E5484D" };

// Values from nLow up to (not including) nHigh are normal.
// Between the normal band and rLow / rHigh is borderline (yellow).
// Beyond rLow / rHigh is out of range (red).
function classify(v, b) {
  if (v >= b.nLow && v < b.nHigh) return { level: "green", dir: "normal" };
  if (v >= b.nHigh) {
    return { level: v >= b.rHigh ? "red" : "yellow", dir: "high" };
  }
  return { level: v < b.rLow ? "red" : "yellow", dir: "low" };
}

const LAB_TESTS = [
  {
    key: "glucose",
    title: "Fasting Blood Glucose",
    match: "glucose",
    unit: "mg/dL",
    bands: { nLow: 70, nHigh: 100, rLow: 50, rHigh: 120 },
    normalText: "Normal: 70 to 99 mg/dL",
    detail:
      "Borderline: 50 to 69 or 100 to 119 mg/dL. Out of range: below 50 or 120 and above.",
    advice: (level, dir) => {
      if (level === "green") {
        return [
          "Normal. Your fasting glucose is in the healthy range.",
          "Keep up regular meals, hydration and daily exercise, and keep logging results."
        ];
      }
      if (level === "yellow") {
        return [
          `Borderline. Your fasting glucose is slightly ${dir}.`,
          "Check with the health specialist on board.",
          "Make sure the sample was taken after a proper fast."
        ];
      }
      return [
        `Sugar too ${dir}.`,
        "Monitor your other metrics too: heart rate, blood pressure, oxygen level and weight.",
        "Ask the ground station for more guidance."
      ];
    }
  },
  {
    key: "calcium",
    title: "Calcium",
    match: "calcium",
    unit: "mg/dL",
    bands: { nLow: 8.6, nHigh: 10.3, rLow: 8.0, rHigh: 10.8 },
    normalText: "Normal: 8.6 to 10.2 mg/dL",
    detail:
      "Borderline: 8.0 to 8.5 or 10.3 to 10.7 mg/dL. Out of range: below 8.0 or 10.8 and above.",
    advice: (level, dir) => {
      if (level === "green") {
        return [
          "Normal. Calcium is in the healthy range.",
          "Keep up the daily exercise routine. It helps protect bone in microgravity."
        ];
      }
      const lines = [
        level === "yellow"
          ? `Borderline. Calcium is slightly ${dir}.`
          : `Calcium is too ${dir}.`
      ];
      if (level === "yellow") {
        lines.push("Check with the health specialist on board.");
      }
      if (dir === "low") {
        lines.push(
          "Do your scheduled exercise, especially resistance exercise, to help protect bone."
        );
      } else {
        lines.push(
          "Drink enough fluids, and avoid extra calcium supplements unless the flight surgeon says so."
        );
      }
      lines.push(
        "Check the renal (kidney) profile too, because calcium and kidney function are linked."
      );
      if (level === "red") lines.push("Ask the ground station for more guidance.");
      return lines;
    }
  },
  {
    key: "creatinine",
    title: "Creatinine",
    match: "creatinine",
    unit: "mg/dL",
    bands: { nLow: 0.6, nHigh: 1.4, rLow: 0.5, rHigh: 1.6 },
    normalText: "Normal: 0.6 to 1.3 mg/dL",
    detail:
      "Borderline: 0.5 to 0.59 or 1.4 to 1.5 mg/dL. Out of range: below 0.5 or 1.6 and above.",
    advice: (level, dir) => {
      if (level === "green") {
        return [
          "Normal. Creatinine is in the healthy range, which suggests the kidneys are filtering normally.",
          "Keep drinking enough fluids."
        ];
      }
      const lines = [
        level === "yellow"
          ? `Borderline. Creatinine is slightly ${dir}.`
          : `Creatinine is too ${dir}.`
      ];
      if (level === "yellow") {
        lines.push("Check with the health specialist on board.");
      }
      if (dir === "high") {
        lines.push(
          "High creatinine can point to dehydration or reduced kidney function. Drink enough fluids."
        );
      } else {
        lines.push(
          "Low creatinine can go with muscle loss. Keep up resistance exercise."
        );
      }
      lines.push("Check the full renal (kidney) profile.");
      if (level === "red") lines.push("Ask the ground station for more guidance.");
      return lines;
    }
  }
];

// Newest result whose test name contains `match` (for example "glucose").
function latestFor(results, match) {
  const found = results.filter(
    (r) =>
      String(r.test_name || "").toLowerCase().includes(match) &&
      Number.isFinite(Number(r.value))
  );
  if (found.length === 0) return null;

  return found.reduce((a, b) => {
    const ta = new Date(a.measured_at).getTime();
    const tb = new Date(b.measured_at).getTime();
    return tb > ta || (tb === ta && b.id > a.id) ? b : a;
  });
}

function LabCard({ spec, result }) {
  const [open, setOpen] = useState(false);

  let status = null;
  let unsupported = false;
  let unitLabel = spec.unit;

  if (result) {
    const unit = String(result.unit ?? "").trim();
    const unitLower = unit.toLowerCase();
    const hasUnit = unitLower !== "" && unitLower !== "nan";

    unsupported = hasUnit && !unitLower.includes("mg/dl");
    if (hasUnit) unitLabel = unit;
    if (!unsupported) status = classify(Number(result.value), spec.bands);
  }

  const color = status ? LEVEL_COLOR[status.level] : "rgba(127,127,127,.6)";

  let chip = "No data";
  if (result && unsupported) chip = "Unit not checked";
  else if (status) {
    chip =
      status.level === "green"
        ? "Normal"
        : status.level === "yellow"
        ? `Borderline ${status.dir}`
        : `Too ${status.dir}`;
  }

  const adviceLines = status ? spec.advice(status.level, status.dir) : [];

  return (
    <article
      style={{
        border: "1px solid rgba(127,127,127,.3)",
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        padding: "16px 18px"
      }}
    >
      <div
        style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: 12
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{spec.title}</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {result
              ? `Measured ${new Date(result.measured_at).toLocaleDateString(undefined, {
                  day: "numeric", month: "short", year: "numeric"
                })}, ${result.sample_type} sample`
              : `Upload a lab file with a test named "${spec.match}".`}
          </div>
        </div>

        <span
          style={{
            padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            color, background: status ? `${color}26` : "rgba(127,127,127,.15)"
          }}
        >
          {chip}
        </span>
      </div>

      {result && (
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 30, fontWeight: 700 }}>{result.value}</span>
          <span style={{ marginLeft: 6, opacity: 0.65 }}>{unitLabel}</span>
          <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>
            {spec.normalText}
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 10, padding: "6px 0", background: "none", border: "none",
            color: "inherit", font: "inherit", fontWeight: 600,
            textDecoration: "underline", cursor: "pointer"
          }}
        >
          {open ? "Show less" : "Read more"}
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      )}

      {result && open && (
        <div
          style={{
            marginTop: 8, paddingTop: 12,
            borderTop: "1px solid rgba(127,127,127,.25)", lineHeight: 1.55
          }}
        >
          {unsupported ? (
            <p style={{ margin: 0 }}>
              This value is in {unitLabel}. The ranges here use {spec.unit}, so
              convert the value and upload it again.
            </p>
          ) : (
            adviceLines.map((line, i) => (
              <p key={i} style={{ margin: "0 0 8px", fontWeight: i === 0 ? 600 : 400 }}>
                {line}
              </p>
            ))
          )}
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.65 }}>
            {spec.detail}
          </p>
        </div>
      )}
    </article>
  );
}

export default function Analytics({ records, type }) {
  const [labResults, setLabResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLabResults() {
      try {
        const response = await fetch(
          `${API_URL}/lab-results/?mission_type=${type}`
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = await response.json();
        if (!cancelled && Array.isArray(data)) setLabResults(data);
      } catch (error) {
        console.error("Could not load lab results:", error);
      }
    }

    loadLabResults();

    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div style={{ maxWidth: 880 }}>
      <BloodPressureChart records={records}/>

      <h2 className="section-title" style={{ marginTop: 34 }}>
        Key lab markers
      </h2>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Latest value from the uploaded lab files.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {LAB_TESTS.map((spec) => (
          <LabCard
            key={spec.key}
            spec={spec}
            result={latestFor(labResults, spec.match)}
          />
        ))}
      </div>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 16 }}>
        These ranges and tips are demo guidance, not medical advice. The flight
        surgeon sets the real limits.
      </p>
    </div>
  );
}