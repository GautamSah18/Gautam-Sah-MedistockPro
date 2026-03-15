import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../../../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/api/dashboard/admin/dashboard/");
      setData(res.data);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  };

  if (!data) {
    return <div className="dashboard-loading">Loading Dashboard...</div>;
  }

  /* ---------- Chart Data ---------- */

  // Sales Trend (Mock or from API later)
  const salesTrend = data.sales_trend || [
    { day: "Mon", sales: 1200 },
    { day: "Tue", sales: 1800 },
    { day: "Wed", sales: 1500 },
    { day: "Thu", sales: 2000 },
    { day: "Fri", sales: 2400 },
    { day: "Sat", sales: 1700 },
    { day: "Sun", sales: 2200 },
  ];

  // Order Status
  const orderStatus = data.order_status || [
    { name: "Completed", value: data.total_orders },
    { name: "Pending", value: Math.floor(data.total_orders * 0.3) },
    { name: "Cancelled", value: Math.floor(data.total_orders * 0.1) },
  ];

  // Stock Distribution
  const stockDistribution = data.stock_distribution || [
    { name: "In Stock", value: 60 },
    { name: "Low Stock", value: data.low_stock_count },
    { name: "Out of Stock", value: 10 },
  ];

  // Loyalty Tier Distribution
  const tierDistribution = data.loyalty_tier_distribution || [];

  const orderColors = ["#0f3d2e", "#4CAF50", "#FCA5A5"];
  const stockColors = ["#4CAF50", "#FDE68A", "#FCA5A5"];
  const tierColors = ["#9ca3af", "#b45309", "#cbd5e1", "#fbbf24", "#06b6d4"];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, here's what's happening today.</p>
      </div>

      {/* KPI CARDS */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card">
          <span>Total Sales</span>
          <h2>Rs. {data.total_sales}</h2>
        </div>

        <div className="dashboard-kpi-card">
          <span>Total Orders</span>
          <h2>{data.total_orders}</h2>
        </div>

        <div className="dashboard-kpi-card">
          <span>Total Users</span>
          <h2>{data.total_users}</h2>
        </div>

        <div className="dashboard-kpi-card">
          <span>Low Stock Count</span>
          <h2>{data.low_stock_count} Items</h2>
        </div>

        <div className="dashboard-kpi-card">
          <span>Loyalty Accounts</span>
          <h2>{data.total_loyalty_accounts || 0}</h2>
        </div>

        <div className="dashboard-kpi-card">
          <span>Unpaid Credit Bills</span>
          <h2>Rs. {data.total_unpaid_bills_amount || 0}</h2>
        </div>
      </div>

      {/* SECOND ROW - LINE & PIE CHART */}
      <div className="dashboard-bottom-grid">
        {/* Sales Trend */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Sales Trend</h3>
            <p>Last 7 Days Performance</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesTrend}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#4CAF50"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Order Status</h3>
            <p>Distribution of Orders</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={orderStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={orderColors[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* THIRD ROW - BAR & LOW STOCK TABLE */}
      <div className="dashboard-bottom-grid">
        {/* Top Medicine Sales */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>Top Medicine Sales</h3>
              <p>Top 5 Products - Last 30 Days</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.top_medicines}>
              <XAxis dataKey="medicine__name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#0f3d2e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Medicines */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3>Low Stock Medicines</h3>
              <p>Inventory items requiring attention</p>
            </div>
          </div>

          <div className="dashboard-stock-table">
            <div className="dashboard-stock-header">
              <span>MEDICINE NAME</span>
              <span>IN STOCK</span>
              <span>ACTION</span>
            </div>

            {data.low_stock_items.map((item, index) => (
              <div className="dashboard-stock-row" key={index}>
                <div>
                  <strong>{item.name}</strong>
                </div>
                <span className="dashboard-badge">
                  {item.stock} units
                </span>
                <button className="dashboard-restock-btn">Restock</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOURTH ROW - DONUT CHARTS */}
      <div className="dashboard-bottom-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Stock Distribution</h3>
            <p>Inventory Health Overview</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
              >
                {stockDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={stockColors[index % stockColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Loyalty Tier Distribution */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Loyalty Tier Distribution</h3>
            <p>Customers by Loyalty Tier</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            {tierDistribution.length > 0 ? (
              <PieChart>
                <Pie
                  data={tierDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {tierDistribution.map((entry, index) => {
                    const tierName = entry.name.toLowerCase();
                    let color = "#9ca3af"; // regular
                    if (tierName === "bronze") color = "#b45309";
                    else if (tierName === "silver") color = "#94a3b8";
                    else if (tierName === "gold") color = "#fbbf24";
                    else if (tierName === "diamond") color = "#06b6d4";
                    
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                No loyalty accounts found.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}