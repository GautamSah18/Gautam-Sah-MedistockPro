import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import TopNav from "./TopNav";
import "./customerDashboard.css";

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/billing/customer-orders/");
      setOrders(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBill = (billId) => {
    const token = localStorage.getItem('access_token');
    const baseUrl = api.defaults.baseURL || '';
    const url = `${baseUrl}/api/billing/${billId}/print/?token=${token}`;
    
    // Open in a new window. The print_bill.html automatically triggers print dialog.
    window.open(url, '_blank');
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'paid':
        return { text: 'Paid', className: 'status-paid' };
      case 'pending':
        return { text: 'Pending', className: 'status-pending' };
      case 'due':
        return { text: 'Due', className: 'status-due' };
      default:
        return { text: status, className: 'status-default' };
    }
  };

  if (loading) {
    return (
      <div className="mdp">
        <TopNav />
        <div className="loading-container">
          <div className="loading">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mdp">
      <TopNav />
      
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>View your purchase history and download bills</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="orders-container">
          {orders.length === 0 ? (
            <div className="empty-state">
              <h3>No Orders Found</h3>
              <p>You haven't placed any orders yet.</p>
              <button 
                className="primary-btn" 
                onClick={() => navigate("/customerDashboard")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const statusInfo = formatStatus(order.payment_status);
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3>Order #{order.invoice_number}</h3>
                        <p className="order-date">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${statusInfo.className}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-summary">
                        <div className="summary-item">
                          <span>Items:</span>
                          <span>{order.items.length} items</span>
                        </div>
                        <div className="summary-item">
                          <span>Subtotal:</span>
                          <span>Rs {Number(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                          <span>Discount:</span>
                          <span>Rs {Number(order.discount).toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                          <span>Tax:</span>
                          <span>Rs {Number(order.tax_total).toFixed(2)}</span>
                        </div>
                        <div className="summary-item total">
                          <span>Total:</span>
                          <span>Rs {Number(order.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="order-actions">
                        <button 
                          className="secondary-btn"
                          onClick={() => handleDownloadBill(order.id)}
                        >
                          📥 Download Bill
                        </button>
                        {order.payment_status === 'due' && (
                          <button 
                            className="primary-btn"
                            onClick={() => navigate("/payment", { 
                              state: { 
                                orderId: order.id, 
                                totalAmount: order.total_amount 
                              } 
                            })}
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {order.payment_type === 'credit' && (
                      <div className="credit-info">
                        <span className="credit-tag">Credit Purchase</span>
                        <span className="due-date">
                          {(() => {
                            const createdDate = new Date(order.created_at);
                            const dueDate = new Date(createdDate.getTime() + 60 * 24 * 60 * 60 * 1000);
                            const diffDays = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays > 0) return `${diffDays} days to pay`;
                            if (diffDays === 0) return `Due today`;
                            return `Overdue by ${Math.abs(diffDays)} days`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}