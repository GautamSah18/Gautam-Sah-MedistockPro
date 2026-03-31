import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function LoyaltyAdmin() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [creditBills, setCreditBills] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [accRes, billRes] = await Promise.all([
                api.get("/api/loyalty/admin/accounts/"),
                api.get("/api/loyalty/admin/credit-bills/")
            ]);
            setAccounts(accRes.data);
            setCreditBills(billRes.data);
        } catch (err) {
            setError("Failed to load loyalty admin data.");
        } finally {
            setLoading(false);
        }
    };

    const payBill = async (billId) => {
        try {
            setLoading(true);
            await api.post(`/api/loyalty/admin/pay-credit-bill/${billId}/`);
            alert("Bill marked as paid successfully!");
            fetchData();
        } catch (err) {
            alert("Error updating bill status.");
            setLoading(false);
        }
    };

    const getTierColor = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'regular': return '#9ca3af';
            case 'bronze': return '#b45309';
            case 'silver': return '#9ca3af';
            case 'gold': return '#fbbf24';
            case 'diamond': return '#06b6d4';
            default: return '#6b7280';
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Accounts Table */}
                <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <h2 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Customer Loyalty Accounts</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>User ID</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Tier</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "10px" }}>Customer {acc.user}</td>
                                    <td style={{ padding: "10px" }}>
                                        <span style={{
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            background: `${getTierColor(acc.tier)}20`,
                                            color: getTierColor(acc.tier)
                                        }}>
                                            {acc.tier_display || acc.tier}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px", fontWeight: "bold" }}>{acc.total_points}</td>
                                </tr>
                            ))}
                            {accounts.length === 0 && (
                                <tr><td colSpan="3" style={{ padding: "10px", textAlign: "center" }}>No accounts found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Credit Bills Table */}
                <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <h2 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Credit Bills Monitoring</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Customer / Bill ID</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Amount</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Due Date</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                                <th style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditBills.map(bill => (
                                <tr key={bill.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                    <td style={{ padding: "10px" }}>User {bill.user}</td>
                                    <td style={{ padding: "10px" }}>Rs {Number(bill.total_amount).toFixed(2)}</td>
                                    <td style={{ padding: "10px" }}>{new Date(bill.due_date).toLocaleDateString()}</td>
                                    <td style={{ padding: "10px" }}>
                                        <span style={{
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            background: bill.status === 'paid' ? '#d1fae5' : '#fee2e2',
                                            color: bill.status === 'paid' ? '#065f46' : '#991b1b'
                                        }}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px" }}>
                                        {bill.status === 'unpaid' && (
                                            <button
                                                onClick={() => payBill(bill.id)}
                                                style={{ background: "#0ea5e9", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}
                                            >
                                                Mark as Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {creditBills.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: "10px", textAlign: "center" }}>No credit bills found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
