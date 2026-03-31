import { useState } from "react";
import { FaCloudUploadAlt, FaFilePdf, FaImage, FaPaperPlane } from "react-icons/fa";
import TopNav from "./TopNav";
import "./customerDashboard.css";

export default function CustomerPrescriptions() {
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1800);
    setFileName("");
    setNote("");
  };

  return (
    <div className="mdp">
      <TopNav showSearch={false} cartCount={0} onCartClick={() => {}} />

      <div className="page-wrap">
        <div className="page-card">
          <h2>Prescriptions</h2>
          <p className="page-sub">
            Upload your prescription (image/PDF) and send request for medicines.
          </p>

          <label className="upload-box" style={{ display: "block" }}>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.20)",
                  color: "#1d4ed8",
                  fontSize: 22,
                  flex: "0 0 auto",
                }}
              >
                <FaCloudUploadAlt />
              </div>

              <div style={{ flex: 1 }}>
                <div className="upload-title">Click to upload prescription</div>
                <div className="upload-sub">
                  {fileName ? (
                    <span style={{ fontWeight: 800, color: "#111827" }}>{fileName}</span>
                  ) : (
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <FaImage /> JPG/PNG <FaFilePdf /> PDF supported
                    </span>
                  )}
                </div>
              </div>
            </div>
          </label>

          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notes (optional): quantity, brand preference, delivery time..."
          />

          <button className="primary-btn" onClick={submit} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <FaPaperPlane />
            Submit Prescription
          </button>

          {submitted ? (
            <div
              style={{
                marginTop: 12,
                borderRadius: 16,
                padding: "10px 12px",
                background: "rgba(32,180,106,0.12)",
                border: "1px solid rgba(32,180,106,0.22)",
                color: "#0f7a44",
                fontWeight: 900,
              }}
            >
              ✅ Prescription submitted successfully!
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
