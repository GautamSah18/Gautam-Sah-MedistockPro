import { useEffect, useState } from "react";
import api from "../../../services/api";

const AppliedSchemes = () => {
  const [appliedSchemes, setAppliedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppliedSchemes = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/bonus-schemes/applied-schemes/all/");
        setAppliedSchemes(response.data);
      } catch (err) {
        console.error("Error fetching applied schemes:", err);
        setError("Failed to load applied schemes");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedSchemes();
  }, []);

  if (loading) {
    return (
      <div className="bonus-management-content">
        <div className="loading">Loading applied schemes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bonus-management-content">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="bonus-management-content">
      <div className="management-header">
        <h2>Applied Schemes</h2>
        <p>View all schemes applied by customers</p>
      </div>

      <div className="table-container">
        <h3>Applied Schemes ({appliedSchemes.length})</h3>
        {appliedSchemes.length > 0 ? (
          <table className="management-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Scheme Name</th>
                <th>Selected Gifts</th>
                <th>Total Gift Value</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {appliedSchemes.map((applied) => (
                <tr key={applied.id}>
                  <td>
                    <div>
                      <strong>{applied.customer?.email || "N/A"}</strong>
                      {(applied.customer?.first_name || applied.customer?.last_name) && (
                        <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                          {`${applied.customer.first_name || ''} ${applied.customer.last_name || ''}`.trim()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{applied.scheme?.name || "N/A"}</strong>
                      <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                        {applied.scheme?.description?.substring(0, 50)}
                        {applied.scheme?.description?.length > 50 ? "..." : ""}
                      </div>
                    </div>
                  </td>
                  <td>
                    {applied.selected_gifts?.length > 0 ? (
                      <div>
                        {applied.selected_gifts.map((gift, index) => (
                          <div key={gift.id} style={{ marginBottom: "4px" }}>
                            <span style={{ fontWeight: "600" }}>{gift.name}</span>
                            {index < applied.selected_gifts.length - 1 && ", "}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#6b7280" }}>No gifts selected</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", color: "#20b46a" }}>
                      Rs {parseFloat(applied.total_gift_value || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    {applied.applied_at
                      ? new Date(applied.applied_at).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-row">No schemes have been applied yet.</div>
        )}
      </div>
    </div>
  );
};

export default AppliedSchemes;