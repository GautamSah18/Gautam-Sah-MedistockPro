import { useEffect, useState } from "react";
import api from "../../../services/api";

const ExpiryReturnRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/expiry-return/admin/all/");
            setRequests(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching expiry return requests:", err);
            setError("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/api/expiry-return/admin/${id}/update/`, { status });
            alert(`Request ${status} successfully!`);
            fetchRequests(); // Refresh data
        } catch (err) {
            console.error(`Error updating request to ${status}:`, err);
            alert(`Failed to ${status.toLowerCase()} request`);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved":
                return { backgroundColor: "#10b981", color: "white" };
            case "Rejected":
                return { backgroundColor: "#ef4444", color: "white" };
            case "Pending":
                return { backgroundColor: "#f59e0b", color: "white" };
            default:
                return { backgroundColor: "#6b7280", color: "white" };
        }
    };

    if (loading) return <div className="loading">Loading requests...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="inventory-table-wrapper">
            <div className="inventory-table-container">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Medicine</th>
                            <th>Batch</th>
                            <th>Expiry Date</th>
                            <th>Quantity</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th className="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>#{req.id}</td>
                                    <td>
                                        <strong>{req.customer_name}</strong>
                                        <br />
                                        <small>ID: {req.customer}</small>
                                    </td>
                                    <td>{req.medicine}</td>
                                    <td>{req.batch || "N/A"}</td>
                                    <td>{new Date(req.expiry_date).toLocaleDateString()}</td>
                                    <td>{req.quantity}</td>
                                    <td title={req.reason}>
                                        <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {req.reason || "No reason provided"}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={getStatusStyle(req.status)}
                                        >
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        {req.status === "Pending" ? (
                                            <>
                                                <button
                                                    className="btn-update"
                                                    onClick={() => handleUpdateStatus(req.id, "Approved")}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleUpdateStatus(req.id, "Rejected")}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>Processed</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="inv-empty">
                                    No expiry return requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiryReturnRequests;
