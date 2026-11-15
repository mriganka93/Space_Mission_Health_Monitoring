
import React, { useState } from "react";

export default function HealthLog({ onSave }) {

  const [form, setForm] = useState({
    bloodPressure: "",
    heartRate: "",
    spo2: "",
    temperature: "",
    weight: "",
    notes: ""
  });

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);


  // Handle input changes
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setMessage("");
    setIsError(false);
  };


  // Submit health record to backend
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (isSaving) return;

    setMessage("");
    setIsError(false);

    const record = {
      bloodPressure: form.bloodPressure,
      heartRate: Number(form.heartRate),
      spo2: Number(form.spo2),
      temperature: Number(form.temperature),

      weight: form.weight === ""
        ? null
        : Number(form.weight),

      notes: form.notes.trim(),

      recordedAt: new Date().toISOString()
    };

    try {

      setIsSaving(true);

      if (!onSave) {
        throw new Error(
          "Backend connection is not configured."
        );
      }

      // Send record to FastAPI.
      // Wait until SQLite commit is successful.
      const response = await onSave(record);

      console.log(
        "Health Record Saved to Database:",
        response
      );

      // Show success message only after database commit
      setMessage(
        "Health record saved successfully to database!"
      );

      setIsError(false);

      // Reset form after successful save
      setForm({
        bloodPressure: "",
        heartRate: "",
        spo2: "",
        temperature: "",
        weight: "",
        notes: ""
      });

    } catch (error) {

      console.error(
        "Health Record Save Error:",
        error
      );

      setMessage(
        error.message ||
        "Failed to save health record. Please try again."
      );

      setIsError(true);

    } finally {

      setIsSaving(false);

    }
  };


  // Input styling
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #9BC5E8",
    background: "#F8FBFF",
    color: "#173653",
    marginTop: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
    outline: "none"
  };


  // Label styling
  const labelStyle = {
    display: "block",
    marginBottom: "18px",
    color: "#294D6B",
    fontSize: "14px",
    fontWeight: "600"
  };


  return (

    <div
      style={{
        padding: "28px",
        background: "linear-gradient(145deg, #E5F2FF, #CDE5FA)",
        border: "1px solid #B6D8F4",
        borderRadius: "16px",
        color: "#173653",
        maxWidth: "750px",
        margin: "20px auto",
        boxShadow: "0 8px 25px rgba(49, 156, 224, 0.12)"
      }}
    >

      {/* Header */}

      <h2
        style={{
          color: "#174B78",
          fontSize: "25px",
          marginBottom: "8px"
        }}
      >
        Manual Health Entry
      </h2>

      <p
        style={{
          color: "#52718F",
          marginBottom: "25px",
          fontSize: "14px"
        }}
      >
        Hi Astronaut ! Please enter your health observations
        below from the readings of your health monitoring devices.
      </p>


      <form onSubmit={handleSubmit}>

        {/* Blood Pressure */}

        <label style={labelStyle}>
          Blood Pressure (mmHg)

          <input
            style={inputStyle}
            type="text"
            name="bloodPressure"
            placeholder="Example: 120/80"
            value={form.bloodPressure}
            onChange={handleChange}
            required
            pattern="[0-9]{2,3}/[0-9]{2,3}"
            title="Enter blood pressure as systolic/diastolic, e.g. 120/80"
          />
        </label>


        {/* Heart Rate */}

        <label style={labelStyle}>
          Heart Rate (BPM)

          <input
            style={inputStyle}
            type="number"
            name="heartRate"
            placeholder="Enter heart rate"
            value={form.heartRate}
            onChange={handleChange}
            min="1"
            max="300"
            required
          />
        </label>


        {/* SpO2 */}

        <label style={labelStyle}>
          SpO2 (%)

          <input
            style={inputStyle}
            type="number"
            name="spo2"
            placeholder="Enter oxygen saturation"
            value={form.spo2}
            onChange={handleChange}
            min="0"
            max="100"
            required
          />
        </label>


        {/* Body Temperature */}

        <label style={labelStyle}>
          Body Temperature (°C)

          <input
            style={inputStyle}
            type="number"
            name="temperature"
            placeholder="Example: 36.8"
            value={form.temperature}
            onChange={handleChange}
            min="25"
            max="45"
            step="0.1"
            required
          />
        </label>


        {/* Weight */}

        <label style={labelStyle}>
          Weight (kg) - Optional

          <input
            style={inputStyle}
            type="number"
            name="weight"
            placeholder="Enter weight"
            value={form.weight}
            onChange={handleChange}
            min="1"
            max="500"
            step="0.1"
          />
        </label>


        {/* Quick Note */}

        <div
          style={{
            marginTop: "10px",
            marginBottom: "25px",
            padding: "20px",
            background: "rgba(255,255,255,0.45)",
            border: "1px solid #B6D8F4",
            borderRadius: "12px"
          }}
        >

          <h3
            style={{
              color: "#174B78",
              fontSize: "17px",
              marginTop: "0",
              marginBottom: "8px"
            }}
          >
            How are you feeling today?
          </h3>

          <p
            style={{
              color: "#52718F",
              fontSize: "13px",
              marginBottom: "12px"
            }}
          >
            Share your mood, symptoms or any physical
            discomfort you are experiencing.
          </p>

          <textarea
            name="notes"
            placeholder="Example: Feeling energetic today, slept well, experiencing mild fatigue..."
            value={form.notes}
            onChange={handleChange}
            rows={4}
            maxLength={1000}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "110px",
              fontFamily: "inherit",
              lineHeight: "1.6"
            }}
          />

          <small
            style={{
              color: "#52718F",
              fontSize: "12px"
            }}
          >
            Optional · {form.notes.length}/1000 characters
          </small>

        </div>


        {/* Save Button */}

        <button
          type="submit"
          disabled={isSaving}
          style={{
            width: "100%",
            padding: "14px",
            background: isSaving
              ? "#8BB8D8"
              : "linear-gradient(90deg, #258BD1, #176BB3)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isSaving
              ? "not-allowed"
              : "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 4px 12px rgba(37, 139, 209, 0.2)"
          }}
        >
          {isSaving
            ? "Saving to Database..."
            : "Save Health Record"}
        </button>


        {/* Success / Error Message */}

        {message && (

          <p
            role="status"
            style={{
              color: isError
                ? "#C0392B"
                : "#167347",
              marginTop: "15px",
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            {isError ? "⚠" : "✓"} {message}
          </p>

        )}

      </form>


      {/* Footer */}

      <p
        style={{
          color: "#52718F",
          fontSize: "12px",
          marginTop: "22px",
          lineHeight: "1.6"
        }}
      >
        Health observations are recorded for mission
        monitoring and should not replace professional
        medical assessment.
      </p>

    </div>
  );
}
