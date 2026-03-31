import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./customerDashboard.css";
import TopNav from "./TopNav";

export default function LoyaltyDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [transactions, setTransactions] = useState([]);
    const [creditBills, setCreditBills] = useState([]);

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true);
            const [dashRes, txnRes, billRes] = await Promise.all([
                api.get("/api/loyalty/dashboard/"),
                api.get("/api/loyalty/transactions/"),
                api.get("/api/loyalty/credit-bills/")
            ]);

            setData(dashRes.data);
            setTransactions(txnRes.data);
            setCreditBills(billRes.data);
        } catch (err) {
            setError("Failed to load loyalty dashboard. Make sure you are a customer.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="mdp"><TopNav showSearch={false} /><div className="container">Loading Loyalty Data...</div></div>;
    }

    if (error || !data) {
        return <div className="mdp"><TopNav showSearch={false} /><div className="container">{error}</div></div>;
    }

    const { account, next_tier, next_tier_points, unpaid_credit_total, unpaid_bills_count } = data;

    // Progress Bar Logic
    const getCurrentTierPoints = (tier) => {
        if (tier === 'regular') return 0;
        if (tier === 'bronze') return 500;
        if (tier === 'silver') return 2000;
        if (tier === 'gold') return 5000;
        if (tier === 'diamond') return 10000;
        return 0;
    };

    const minPoints = getCurrentTierPoints(account.tier);
    const maxPoints = next_tier_points;
    const currentPoints = account.total_points;

    let progress = 100;
    if (minPoints !== maxPoints) {
        progress = ((currentPoints - minPoints) / (maxPoints - minPoints)) * 100;
    }
    if (progress > 100) progress = 100;
    if (progress < 0) progress = 0;

    return (
        <div className="mdp">
            <TopNav showSearch={false} />
            <div className="container" style={{ padding: "40px 20px" }}>
                <h1 style={{ marginBottom: 20, fontSize: "2rem", color: "#111827" }}>Retailer Loyalty Dashboard</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 40 }}>
                    {/* Tier Info */}
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                        <h2 style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: 10 }}>Current Tier</h2>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#059669" }}>
                            {account.tier_display || account.tier}
                        </div>
                        <div style={{ marginTop: 15, width: "100%", background: "#f3f4f6", height: 10, borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{ background: "#059669", height: "100%", width: `${progress}%` }}></div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: "0.9rem", color: "#4b5563" }}>
                            {currentPoints} / {maxPoints} points for {next_tier}
                        </div>
                    </div>

                    {/* Points Info */}
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                        <h2 style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: 10 }}>Total Points</h2>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#111827" }}>
                            {account.total_points}
                        </div>
                        <p style={{ marginTop: 10, color: "#4b5563", fontSize: "0.9rem" }}>
                            Points earned via purchases and early payments.
                        </p>
                    </div>

                    {/* Credit Info */}
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)", borderLeft: "4px solid #ef4444" }}>
                        <h2 style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: 10 }}>Credit Status</h2>
                        <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ef4444" }}>
                            Rs {unpaid_credit_total || 0}
                        </div>
                        <p style={{ marginTop: 10, color: "#4b5563", fontSize: "0.9rem" }}>
                            {unpaid_bills_count} unpaid bill(s).
                        </p>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Credit Bills History */}
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: 20 }}>Credit Bills</h2>
                        {creditBills.length === 0 ? (
                            <p>No credit bills found.</p>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                                        <th style={{ padding: 10 }}>Amount</th>
                                        <th style={{ padding: 10 }}>Due Date</th>
                                        <th style={{ padding: 10 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditBills.map(bill => (
                                        <tr key={bill.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                            <td style={{ padding: 10 }}>Rs {Number(bill.total_amount).toFixed(2)}</td>
                                            <td style={{ padding: 10 }}>{new Date(bill.due_date).toLocaleDateString()}</td>
                                            <td style={{ padding: 10 }}>
                                                <span style={{
                                                    padding: "4px 8px",
                                                    borderRadius: 20,
                                                    fontSize: "0.8rem",
                                                    background: bill.status === 'paid' ? '#d1fae5' : '#fee2e2',
                                                    color: bill.status === 'paid' ? '#065f46' : '#991b1b'
                                                }}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Loyalty Transactions */}
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: 20 }}>Recent Activity</h2>
                        {transactions.length === 0 ? (
                            <p>No loyalty activity found.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {transactions.slice(0, 10).map(txn => (
                                    <li key={txn.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                                        <div>
                                            <div style={{ fontWeight: "500" }}>{txn.reason_display}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{new Date(txn.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ fontWeight: "bold", color: txn.points > 0 ? "#10b981" : "#ef4444" }}>
                                            {txn.points > 0 ? "+" : ""}{txn.points} pts
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
