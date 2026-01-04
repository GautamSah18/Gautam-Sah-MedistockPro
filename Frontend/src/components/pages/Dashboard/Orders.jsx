import { useState } from "react";
import { FaBoxOpen, FaHome, FaTruck } from "react-icons/fa";
import "./CustomerDashboard.css";
import TopNav from "./TopNav";

const orders = [
  { id: "1023", date: "2025-12-28", amount: 20000, status: "Dispatch", items: 6 },
  { id: "1018", date: "2025-12-25", amount: 8500, status: "Packing", items: 3 },
  { id: "1009", date: "2025-12-18", amount: 12000, status: "Delivered", items: 4 },
];

const steps = [
  { key: "Packing", label: "Packing", icon: <FaBoxOpen /> },
  { key: "Dispatch", label: "Dispatch", icon: <FaTruck /> },
  { key: "Delivered", label: "Delivered", icon: <FaHome /> },
];

export default function Orders() {
  const [selected, setSelected] = useState(orders[0]);

  const idx = steps.findIndex((s) => s.key === selected.status);

  return (
    <div className="mdp">
      <TopNav showSearch={false} />
      <div className="page-wrap">
        <div className="page-card">
          <h2>Order Status Tracking</h2>
          <p className="page-sub">Track your order in real-time: Packing → Dispatch → Delivery.</p>

          <div className="orders-layout">
            <div className="orders-list">
              {orders.map((o) => (
                <button
                  key={o.id}
                  className={`order-tile ${selected.id === o.id ? "active" : ""}`}
                  onClick={() => setSelected(o)}
                >
                  <div className="order-top">
                    <div className="order-id">Order #{o.id}</div>
                    <div className={`status-pill st-${o.status.toLowerCase()}`}>{o.status}</div>
                  </div>
                  <div className="order-meta">
                    <span>{o.date}</span>
                    <span>{o.items} items</span>
                    <strong>Rs {o.amount}</strong>
                  </div>
                </button>
              ))}
            </div>

            <div className="orders-detail">
              <div className="detail-head">
                <div className="detail-title">Order #{selected.id}</div>
                <div className="detail-sub">Current Status: <b>{selected.status}</b></div>
              </div>

              <div className="steps">
                {steps.map((s, i) => (
                  <div key={s.key} className={`step ${i <= idx ? "done" : ""}`}>
                    <div className="step-dot">{s.icon}</div>
                    <div className="step-label">{s.label}</div>
                    {i < steps.length - 1 ? <div className={`step-line ${i < idx ? "done" : ""}`} /> : null}
                  </div>
                ))}
              </div>

              <div className="detail-box">
                <div className="detail-row"><span>Order Date</span><b>{selected.date}</b></div>
                <div className="detail-row"><span>Items</span><b>{selected.items}</b></div>
                <div className="detail-row"><span>Amount</span><b>Rs {selected.amount}</b></div>
                <div className="detail-hint">
                  Tip: After Dispatch, you will receive delivery confirmation notification.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
