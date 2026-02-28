import { LogOut, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./deliveryDashboard.css";

export default function DeliveryDashboard() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders/delivery/");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching delivery orders", err);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.patch(`/api/orders/${orderId}/accept/`);
      fetchOrders();
    } catch (err) {
      console.error("Accept order failed", err);
    }
  };

  const handleStatusChange = (orderId, value) => {
    setSelectedStatus((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const updateStatus = async (orderId) => {
    const newStatus = selectedStatus[orderId];
    if (!newStatus) return;

    try {
      setUpdatingId(orderId);

      await api.patch(`/api/orders/${orderId}/update-status/`, {
        status: newStatus,
      });

      fetchOrders();
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="loading">Loading orders...</p>;
  }

  return (
    <div className="delivery-page">
      <header className="delivery-header">
        <div className="header-left">
          <Truck size={24} className="logo-icon" />
          <h1>MediStock Pro</h1>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="delivery-container">
        <div className="dashboard-intro">
          <h2>Delivery Dashboard</h2>
          <p>Manage and update delivery orders manually</p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <Truck size={40} />
            <p>No Orders Available</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="delivery-card">
              <div className="card-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p><strong>Customer:</strong> {order.customer_email}</p>
                  <p><strong>Total:</strong> Rs. {order.total_amount}</p>
                </div>

                <span className={`status ${order.status}`}>
                  {order.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>

              {/* Accept Section */}
              {!order.is_accepted ? (
                <div className="accept-section">
                  <button
                    className="accept-btn"
                    onClick={() => acceptOrder(order.id)}
                  >
                    Accept Order
                  </button>
                </div>
              ) : (
                <div className="status-update-section">
                  <select
                    value={selectedStatus[order.id] || ""}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="received">Order Received</option>
                    <option value="packing">Packing</option>
                    <option value="ready_for_dispatch">Ready for Dispatch</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="delivered">Delivered</option>
                  </select>

                  <button
                    onClick={() => updateStatus(order.id)}
                    disabled={
                      !selectedStatus[order.id] ||
                      updatingId === order.id
                    }
                  >
                    {updatingId === order.id ? "Updating..." : "Update"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}