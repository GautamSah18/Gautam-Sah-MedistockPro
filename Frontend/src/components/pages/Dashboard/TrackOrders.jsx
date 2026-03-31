import React, { useEffect, useState } from "react";
import TopNav from "./TopNav";
import "./TrackOrders.css";
import { FaCheck, FaTruck } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import api from "../../../services/api";

export default function TrackOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 10000); // auto refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders/customer/");
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "received":
        return "20%";
      case "packing":
        return "40%";
      case "ready_for_dispatch":
        return "60%";
      case "out_for_delivery":
        return "80%";
      case "delivered":
        return "100%";
      default:
        return "0%";
    }
  };

  const stepStatus = (current, step) => {
    const orderFlow = [
      "received",
      "packing",
      "ready_for_dispatch",
      "out_for_delivery",
      "delivered",
    ];

    const currentIndex = orderFlow.indexOf(current);
    const stepIndex = orderFlow.indexOf(step);

    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "";
  };

  return (
    <>
      <TopNav />

      <div className="track-page">

        <div className="track-header">
          <div>
            <h1>Track Your Order</h1>
            <p>View the live progress of your orders.</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">
              <FiSearch />
            </div>
            <h3>No Orders Found</h3>
            <p>You have not placed any orders yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">

              <div className="order-top">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>Order Date: {new Date(order.created_at).toDateString()}</p>
                </div>

                <div className="order-status">
                  <span className="status-pill green">
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="progress-wrapper">
                <div className="progress-line-bg"></div>
                <div
                  className="progress-line-active"
                  style={{ width: getProgressWidth(order.status) }}
                ></div>

                <div className="progress-steps">

                  {["received", "packing", "ready_for_dispatch", "out_for_delivery", "delivered"].map((step) => (
                    <div key={step} className={`step ${stepStatus(order.status, step)}`}>
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

              <div className="order-bottom">
                <p>Total: Rs. {order.total_amount}</p>
              </div>

            </div>
          ))
        )}

      </div>
    </>
  );
}