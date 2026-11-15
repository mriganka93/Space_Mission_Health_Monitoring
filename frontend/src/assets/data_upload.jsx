import { useState, useEffect, useRef } from "react";
import {
  Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";
const COLUMNS = ["date", "sample_type", "test_name", "value", "unit"];
const ALLOWED = [".csv", ".xlsx", ".xls"];
const SAMPLE_TONES = { blood: "#E0627A", urine: "#D99B49" };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

const STYLES = `
.du { max-width: 880px; }
.du-lead { margin: 0 0 12px; opacity: .75; line-height: 1.5; max-width: 62ch; }
.du-cols { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 22px; }
.du-cols code {
  font-size: 12px; padding: 3px 8px; border-radius: 6px;
  border: 1px solid rgba(127,127,127,.3); background: rgba(127,127,127,.08);
}

.du-drop {
  position: relative; display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 40px 20px; text-align: center; cursor: pointer;
  border: 2px dashed rgba(127,127,127,.4); border-radius: 16px;
  transition: border-color .15s, background .15s;
}
.du-drop:hover, .du-drop.is-over {
  border-color: var(--accent);
  background: rgba(127,127,127,.08);
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}
.du-drop:focus-within { outline: 2px solid var(--accent); outline-offset: 3px; }
.du-drop input {
  position: absolute; inset: 0; width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
}
.du-drop-icon { color: var(--accent); }
.du-drop-title { font-size: 17px; font-weight: 600; }
.du-drop-sub { font-size: 13px; opacity: .65; }

.du-file {
  display: flex; align-items: center; gap: 12px; margin-top: 14px;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(127,127,127,.3); background: rgba(127,127,127,.08);
}
.du-file-icon { color: var(--accent); flex-shrink: 0; }
.du-file-info { flex: 1; min-width: 0; }
.du-file-name { font-weight: 600; overflow-wrap: anywhere; }
.du-file-size { font-size: 12px; opacity: .65; }
.du-icon-btn {
  display: flex; padding: 6px; border: none; border-radius: 8px;
  background: none; color: inherit; opacity: .6; cursor: pointer;
}
.du-icon-btn:hover { opacity: 1; background: rgba(127,127,127,.18); }
.du-icon-btn:focus-visible, .du-submit:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 3px;
}

.du-submit {
  display: inline-flex; align-items: center; gap: 8px; margin-top: 14px;
  padding: 11px 20px; border: none; border-radius: 10px;
  background: var(--accent); color: #fff; font-size: 15px; font-weight: 600;
  cursor: pointer;
}
.du-submit:disabled { opacity: .5; cursor: not-allowed; }

.du-msg {
  display: flex; align-items: flex-start; gap: 10px; margin-top: 14px;
  padding: 12px 14px; border-radius: 12px; font-weight: 500;
}
.du-msg.ok { background: rgba(38,168,138,.15); color: #26A88A; }
.du-msg.err { background: rgba(229,72,77,.15); color: #E5484D; }

.du-groups {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
.du-group {
  overflow: hidden; border-radius: 14px;
  border: 1px solid rgba(127,127,127,.3); border-top: 3px solid var(--tone);
}
.du-group-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 12px 16px; font-weight: 600;
  border-bottom: 1px solid rgba(127,127,127,.25);
}
.du-group-count { font-size: 13px; font-weight: 400; opacity: .65; }
.du-list { max-height: 360px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.du-row {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 10px 16px; border-bottom: 1px solid rgba(127,127,127,.15);
}
.du-row:last-child { border-bottom: none; }
.du-test { font-weight: 500; }
.du-date { font-size: 12px; opacity: .6; }
.du-val { text-align: right; font-weight: 600; white-space: nowrap; }
.du-val small { margin-left: 3px; font-weight: 400; opacity: .65; }
.du-empty { opacity: .7; }

@media (max-width: 520px) { .du-drop { padding: 28px 14px; } }
@media (prefers-reduced-motion: reduce) { .du-drop { transition: none; } }
`;

export default function DataUpload({ type }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { error: boolean, text: string }
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  // Accent follows the mission: blue in flight, rust on Mars.
  const accent = type === "mars" ? "#D77B50" : "#319CE0";

  async function loadResults() {
    try {
      const response = await fetch(
        `${API_URL}/lab-results/?mission_type=${type}`
      );
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      setResults(await response.json());
    } catch (error) {
      console.error("Could not load lab results:", error);
    }
  }

  useEffect(() => {
    loadResults();
  }, [type]);

  function pickFile(candidate) {
    if (!candidate) return;

    const name = candidate.name.toLowerCase();
    if (!ALLOWED.some((ext) => name.endsWith(ext))) {
      setFile(null);
      setMessage({ error: true, text: "Use a .csv, .xlsx or .xls file." });
      return;
    }

    setFile(candidate);
    setMessage(null);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mission_type", type);

      // Do not set Content-Type here. The browser adds it for file uploads.
      const response = await fetch(`${API_URL}/lab-results/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Upload failed."
        );
      }

      setMessage({
        error: false,
        text:
          `${data.saved} row(s) saved to the database` +
          (data.skipped ? `, ${data.skipped} skipped.` : ".")
      });

      clearFile();
      loadResults();
    } catch (error) {
      setMessage({ error: true, text: error.message });
    } finally {
      setUploading(false);
    }
  }

  // Group saved results by sample type: blood, urine, then anything else.
  const grouped = {};
  results.forEach((r) => {
    const key = r.sample_type || "other";
    (grouped[key] = grouped[key] || []).push(r);
  });
  const groupOrder = [
    ...["blood", "urine"].filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => k !== "blood" && k !== "urine")
  ];

  return (
    <div className="du" style={{ "--accent": accent }}>
      <style>{STYLES}</style>

      <h2 className="section-title">Blood and urine results</h2>
      <p className="du-lead">
        Upload one file with both sample types in it. First collect your Blood/Urine result analysis
        from the  tool you are using , then pre-process and format your file as show below ,
        Each row needs these columns:
      </p>
      <div className="du-cols">
        {COLUMNS.map((c) => <code key={c}>{c}</code>)}
      </div>

      <label
        className={`du-drop ${dragging ? "is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          onChange={(e) => pickFile(e.target.files[0])}
        />
        <Upload size={34} className="du-drop-icon"/>
        <span className="du-drop-title">Drop a CSV or Excel file here</span>
        <span className="du-drop-sub">or click to browse your files</span>
      </label>

      {file && (
        <div className="du-file">
          <FileSpreadsheet size={26} className="du-file-icon"/>
          <div className="du-file-info">
            <div className="du-file-name">{file.name}</div>
            <div className="du-file-size">{formatSize(file.size)}</div>
          </div>
          <button
            className="du-icon-btn"
            onClick={clearFile}
            aria-label="Remove file"
          >
            <X size={18}/>
          </button>
        </div>
      )}

      <button
        className="du-submit"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        <Upload size={17}/>
        {uploading ? "Saving..." : "Save to database"}
      </button>

      {message && (
        <div className={`du-msg ${message.error ? "err" : "ok"}`} role="status">
          {message.error ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
          <span>{message.text}</span>
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: 34 }}>
        Saved results
      </h2>

      {results.length === 0 ? (
        <p className="du-empty">
          Nothing saved yet. Upload a file and its results will appear here.
        </p>
      ) : (
        <div className="du-groups">
          {groupOrder.map((key) => (
            <section
              className="du-group"
              key={key}
              style={{ "--tone": SAMPLE_TONES[key] || "#8A79CF" }}
            >
              <header className="du-group-head">
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="du-group-count">
                  {grouped[key].length} result{grouped[key].length === 1 ? "" : "s"}
                </span>
              </header>

              <ul className="du-list">
                {grouped[key].map((r) => (
                  <li className="du-row" key={r.id}>
                    <div>
                      <div className="du-test">{r.test_name}</div>
                      <div className="du-date">{formatDate(r.measured_at)}</div>
                    </div>
                    <div className="du-val">
                      {r.value}<small>{r.unit}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}