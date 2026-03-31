import { useState, useEffect } from "react";
import "./customerDashboard.css";
import TopNav from "./TopNav";
import api from "../../../services/api";

export default function ExpiryReturn() {

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    medicine: "",
    batch: "",
    expiry: "",
    qty: "",
    reason: ""
  });

  // Fetch expiry return history on load
  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await api.get("/api/expiry-return/my-returns/");
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching expiry returns:", error);
    }
  };

  // Submit expiry return request
  const submit = async (e) => {
    e.preventDefault();

    if (!form.medicine || !form.expiry || !form.qty) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/expiry-return/create/", {
        medicine: form.medicine,
        batch: form.batch,
        expiry_date: form.expiry,
        quantity: form.qty,
        reason: form.reason,
      });

      setHistory((prev) => [res.data, ...prev]);

      setForm({
        medicine: "",
        batch: "",
        expiry: "",
        qty: "",
        reason: ""
      });

    } catch (error) {
      console.error("Error submitting expiry return:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mdp">
      <TopNav showSearch={false} />

      <div className="page-wrap">
        <div className="page-card">
          <h2>Expiry Return</h2>
          <p className="page-sub">
            Send return request for expired or near-expiry medicines.
          </p>

          <div className="returns-layout">

            {/* Form Section */}
            <form className="return-form" onSubmit={submit}>
              <div className="form-grid">

                <div className="field">
                  <label>Medicine Name *</label>
                  <input
                    value={form.medicine}
                    onChange={(e) =>
                      setForm({ ...form, medicine: e.target.value })
                    }
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>

                <div className="field">
                  <label>Batch No</label>
                  <input
                    value={form.batch}
                    onChange={(e) =>
                      setForm({ ...form, batch: e.target.value })
                    }
                    placeholder="Batch (optional)"
                  />
                </div>

                <div className="field">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={(e) =>
                      setForm({ ...form, expiry: e.target.value })
                    }
                  />
                </div>

                <div className="field">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({ ...form, qty: e.target.value })
                    }
                    placeholder="Qty"
                  />
                </div>

              </div>

              <label className="field" style={{ display: "block" }}>
                <span style={{ fontWeight: 900, fontSize: 13 }}>
                  Reason
                </span>
                <textarea
                  className="textarea"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  placeholder="Explain (optional)"
                />
              </label>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Return Request"}
              </button>
            </form>

            {/* History Section */}
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

                {history.length === 0 && (
                  <div className="hist-row">
                    <div>No return requests yet.</div>
                  </div>
                )}

                {history.map((h) => (
                  <div className="hist-row" key={h.id}>
                    <div><b>R-{h.id}</b></div>
                    <div>{h.medicine}</div>
                    <div className="right">{h.quantity}</div>
                    <div>{h.expiry_date}</div>
                    <div>
                      <span className={`status-pill st-${h.status.toLowerCase()}`}>
                        {h.status}
                      </span>
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
