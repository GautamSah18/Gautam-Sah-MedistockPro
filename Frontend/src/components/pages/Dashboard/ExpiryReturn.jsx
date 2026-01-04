import { useState } from "react";
import "./CustomerDashboard.css";
import TopNav from "./TopNav";

const initialHistory = [
  { id: "R-201", medicine: "Amoxicillin 250mg", expiry: "2026-01-10", qty: 4, status: "Pending" },
  { id: "R-198", medicine: "ORS Pack", expiry: "2025-12-15", qty: 10, status: "Approved" },
  { id: "R-190", medicine: "Vitamin C Tablets", expiry: "2025-11-20", qty: 3, status: "Rejected" },
];

export default function ExpiryReturn() {
  const [history, setHistory] = useState(initialHistory);
  const [form, setForm] = useState({ medicine: "", batch: "", expiry: "", qty: "", reason: "" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.medicine || !form.expiry || !form.qty) return;

    const newReq = {
      id: `R-${Math.floor(Math.random() * 900 + 200)}`,
      medicine: form.medicine,
      expiry: form.expiry,
      qty: Number(form.qty),
      status: "Pending",
    };
    setHistory((prev) => [newReq, ...prev]);
    setForm({ medicine: "", batch: "", expiry: "", qty: "", reason: "" });
  };

  return (
    <div className="mdp">
      <TopNav showSearch={false} />
      <div className="page-wrap">
        <div className="page-card">
          <h2>Expiry Return</h2>
          <p className="page-sub">Send return request for expired or near-expiry medicines.</p>

          <div className="returns-layout">
            <form className="return-form" onSubmit={submit}>
              <div className="form-grid">
                <div className="field">
                  <label>Medicine Name</label>
                  <input
                    value={form.medicine}
                    onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>
                <div className="field">
                  <label>Batch No</label>
                  <input
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    placeholder="Batch (optional)"
                  />
                </div>
                <div className="field">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    placeholder="Qty"
                  />
                </div>
              </div>

              <label className="field" style={{ display: "block" }}>
                <span style={{ fontWeight: 900, fontSize: 13 }}>Reason</span>
                <textarea
                  className="textarea"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain (optional)"
                />
              </label>

              <button className="primary-btn" type="submit">Submit Return Request</button>
            </form>

            <div className="return-history">
              <div className="hist-title">Return History</div>

              <div className="hist-table">
                <div className="hist-row head">
                  <div>ID</div>
                  <div>Medicine</div>
                  <div className="right">Qty</div>
                  <div>Expiry</div>
                  <div>Status</div>
                </div>

                {history.map((h) => (
                  <div className="hist-row" key={h.id}>
                    <div><b>{h.id}</b></div>
                    <div>{h.medicine}</div>
                    <div className="right">{h.qty}</div>
                    <div>{h.expiry}</div>
                    <div>
                      <span className={`status-pill st-${h.status.toLowerCase()}`}>{h.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="detail-hint">
                Admin will review returns. Approved returns will be collected or credited.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
