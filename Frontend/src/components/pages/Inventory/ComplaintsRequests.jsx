import { useEffect, useState } from "react";
import api from "../../../services/api";

const ComplaintsRequests = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await api.get("/api/complaints/admin/all/");
            setComplaints(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching complaints:", err);
            setError("Failed to load complaints");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/api/complaints/admin/${id}/update/`, { status });
            alert(`Complaint ${status} successfully!`);
            fetchComplaints(); // Refresh data
        } catch (err) {
            console.error(`Error updating complaint to ${status}:`, err);
            alert(`Failed to ${status.toLowerCase()} complaint`);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved":
                return { backgroundColor: "rgba(16, 185, 129, 0.14)", color: "#0f7a44", border: "1px solid rgba(16, 185, 129, 0.25)" };
            case "Rejected":
                return { backgroundColor: "rgba(239, 68, 68, 0.14)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.25)" };
            case "Pending":
                return { backgroundColor: "rgba(245, 158, 11, 0.14)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.25)" };
            default:
                return { backgroundColor: "rgba(107, 114, 128, 0.14)", color: "#374151", border: "1px solid rgba(107, 114, 128, 0.25)" };
        }
    };

    if (loading) return <div className="loading">Loading complaints...</div>;
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
                            <th>Reason</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th className="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.length > 0 ? (
                            complaints.map((comp) => (
                                <tr key={comp.id}>
                                    <td>#{comp.id}</td>
                                    <td>
                                        <strong>{comp.customer_name}</strong>
                                        <br />
                                        <small>ID: {comp.customer}</small>
                                    </td>
                                    <td>{comp.medicine_name}</td>
                                    <td title={comp.reason}>
                                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {comp.reason}
                                        </div>
                                    </td>
                                    <td>{new Date(comp.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={getStatusStyle(comp.status)}
                                        >
                                            {comp.status}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        {comp.status === "Pending" ? (
                                            <>
                                                <button
                                                    className="btn-update"
                                                    onClick={() => handleUpdateStatus(comp.id, "Approved")}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleUpdateStatus(comp.id, "Rejected")}
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
                                <td colSpan={7} className="inv-empty">
                                    No complaints found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintsRequests;
