import { useEffect, useState } from "react";
import { FaCheck, FaTruck } from "react-icons/fa";
import api from "../../../services/api";
import "./DeliveryOrderStatus.css";

const DeliveryOrderStatus = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders/admin/");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "received": return "20%";
      case "packing": return "40%";
      case "ready_for_dispatch": return "60%";
      case "out_for_delivery": return "80%";
      case "delivered": return "100%";
      default: return "0%";
    }
  };

  const stepStatus = (current, step) => {
    const flow = ["received", "packing", "ready_for_dispatch", "out_for_delivery", "delivered"];
    const currentIndex = flow.indexOf(current);
    const stepIndex = flow.indexOf(step);

    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "";
  };

  return (
    <div className="delivery-status-wrapper">

      <div className="delivery-status-grid">
        {orders.map((order) => (
          <div key={order.id} className="delivery-order-card">

            <div className="delivery-order-top">
              <div>
                <h3>Order #{order.id}</h3>
                <p>Customer: {order.customer_email}</p>
                <p>Date: {new Date(order.created_at).toDateString()}</p>
              </div>

              <span className="delivery-status-pill">
                {order.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="delivery-progress-wrapper">
              <div className="delivery-progress-bg"></div>
              <div
                className="delivery-progress-active"
                style={{ width: getProgressWidth(order.status) }}
              ></div>

              <div className="delivery-progress-steps">
                {["received", "packing", "ready_for_dispatch", "out_for_delivery", "delivered"].map((step) => (
                  <div key={step} className={`delivery-step ${stepStatus(order.status, step)}`}>
                    <div className="circle">
                      {stepStatus(order.status, step) === "done" ? (
                        <FaCheck />
                      ) : stepStatus(order.status, step) === "active" ? (
                        <FaTruck />
                      ) : null}
                    </div>
                    <span>{step.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="delivery-order-bottom">
              Total: Rs. {order.total_amount}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default DeliveryOrderStatus;