import React from "react";
import TopNav from "./TopNav";
import "./TrackOrders.css";
import { FaCheck, FaTruck } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

export default function TrackOrders() {
  return (
    <>
      <TopNav />

      <div className="track-page">

        {/* HEADER */}
        <div className="track-header">
          <div>
            <h1>Track Your Order</h1>
            <p>
              View the live progress of your orders and estimated delivery dates.
            </p>
          </div>

          <button className="help-btn">
            <span className="help-icon">?</span> Need Help?
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by Order ID or Product Name..."
            />
          </div>

          <div className="filter-btn">
            Status: In Progress
          </div>

          <div className="filter-btn">
            Date: Last 30 Days
          </div>
        </div>

        {/* ================= ORDER 1 ================= */}
        <div className="order-card">

          <div className="order-top">
            <div>
              <h3>Order #87432-FGH</h3>
              <p>Order Date: 15 Oct 2023</p>
            </div>

            <div className="order-status">
              <p>Estimated Delivery: 20 Oct 2023</p>
              <span className="status-pill green">
                Out for Delivery
              </span>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="progress-wrapper">
            <div className="progress-line-bg"></div>
            <div className="progress-line-active" style={{ width: "75%" }}></div>

            <div className="progress-steps">

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Order<br />Received</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Packing</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Ready for<br />Dispatch</span>
              </div>

              <div className="step active">
                <div className="circle"><FaTruck /></div>
                <span>Out for<br />Delivery</span>
              </div>

              <div className="step">
                <div className="circle grey"></div>
                <span>Delivered</span>
              </div>

            </div>
          </div>

          <div className="order-bottom">
            <p>23 Items • $2,450.75</p>
            <span className="details-link">View Details →</span>
          </div>

        </div>

        {/* ================= ORDER 2 ================= */}
        <div className="order-card">

          <div className="order-top">
            <div>
              <h3>Order #87119-KLM</h3>
              <p>Order Date: 12 Oct 2023</p>
            </div>

            <div className="order-status">
              <p>Delivered: 16 Oct 2023</p>
              <span className="status-pill grey">
                Delivered
              </span>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="progress-wrapper">
            <div className="progress-line-bg"></div>
            <div className="progress-line-active" style={{ width: "100%" }}></div>

            <div className="progress-steps">

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Order<br />Received</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Packing</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Ready for<br />Dispatch</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Out for<br />Delivery</span>
              </div>

              <div className="step done">
                <div className="circle"><FaCheck /></div>
                <span>Delivered</span>
              </div>

            </div>
          </div>

          <div className="order-bottom">
            <p>12 Items • $890.00</p>
            <span className="details-link">View Details →</span>
          </div>

        </div>

        {/* EMPTY STATE */}
        <div className="empty-box">
          <div className="empty-icon">
            <FiSearch />
          </div>
          <h3>No Orders Found</h3>
          <p>
            No orders match your current search and filter criteria. Try adjusting your search.
          </p>
        </div>

      </div>
    </>
  );
}