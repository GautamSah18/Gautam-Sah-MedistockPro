import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import api from "../../../services/api";
import "./customerDashboard.css";
import TopNav from "./TopNav";

export default function CustomerComplaints() {

    const [medicineName, setMedicineName] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [medicines, setMedicines] = useState([]);

    // Fetch medicines for datalist
    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                const response = await api.get("/api/inventory/public/medicines/");
                setMedicines(response.data.results || response.data);
            } catch (err) {
                console.error("Error fetching medicines:", err);
            }
        };
        fetchMedicines();
    }, []);

    // Submit complaint to backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!medicineName || !reason) {
            alert("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);

            await api.post("/api/complaints/create/", {
                medicine_name: medicineName,
                reason: reason
            });

            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);

            setMedicineName("");
            setReason("");

        } catch (error) {
            console.error("Error submitting complaint:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mdp">
            <TopNav showSearch={false} />

            <div className="page-wrap">
                <div className="page-card">

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.20)",
                            color: "#dc2626",
                            fontSize: 20
                        }}>
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>Complaint / Issues</h2>
                            <p className="page-sub" style={{ margin: 0 }}>
                                Report issues regarding any medicine or service.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>

                        <div className="field">
                            <label style={{ fontWeight: 950, fontSize: 13, display: "block", marginBottom: "8px" }}>
                                Medicine Name *
                            </label>

                            <input
                                type="text"
                                list="medicine-list"
                                value={medicineName}
                                onChange={(e) => setMedicineName(e.target.value)}
                                placeholder="Type or select medicine name"
                                className="input"
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--line)",
                                    background: "var(--input-bg)",
                                    color: "var(--text)",
                                    outline: "none",
                                    fontWeight: 700
                                }}
                            />

                            <datalist id="medicine-list">
                                {medicines.map((m) => (
                                    <option key={m.id} value={m.name} />
                                ))}
                            </datalist>
                        </div>

                        <div className="field" style={{ marginTop: "20px" }}>
                            <label style={{ fontWeight: 950, fontSize: 13, display: "block", marginBottom: "8px" }}>
                                Reason for Complaining *
                            </label>

                            <textarea
                                className="textarea"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please describe the issue in detail..."
                                style={{
                                    width: "100%",
                                    minHeight: "120px",
                                    padding: "12px",
                                    borderRadius: "12px",
                                    border: "1px solid var(--line)",
                                    background: "var(--input-bg)",
                                    color: "var(--text)",
                                    outline: "none",
                                    resize: "vertical",
                                    fontWeight: 700
                                }}
                            />
                        </div>

                        <button
                            className="primary-btn"
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "20px",
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                width: "fit-content",
                                padding: "12px 24px"
                            }}
                        >
                            {loading ? "Submitting..." : "Submit Complaint"}
                        </button>

                    </form>

                    {submitted && (
                        <div
                            style={{
                                marginTop: 20,
                                borderRadius: 16,
                                padding: "14px 16px",
                                background: "rgba(32,180,106,0.12)",
                                border: "1px solid rgba(32,180,106,0.22)",
                                color: "#1d8b54",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                        >
                            <span>Your complaint has been submitted successfully. We will get back to you soon.</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
