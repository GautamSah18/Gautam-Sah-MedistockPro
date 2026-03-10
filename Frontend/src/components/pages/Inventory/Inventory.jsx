import { useEffect, useMemo, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/api.js";
import AdminDashboard from "./AdminDashboard";
import AppliedSchemes from "./AppliedSchemes";
import BonusManagement from "./BonusManagement";
import ComplaintsRequests from "./ComplaintsRequests";
import DeliveryOrderStatus from "./DeliveryOrderStatus";
import ExpiryReturnRequests from "./ExpiryReturnRequests";
import "./Inventory.css";
import Orders from "./Orders";
import SchemeManagement from "./SchemeManagement";

const Inventory = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'bonuses', 'schemes', 'orders', 'applied-schemes', 'expiry-return', 'complaints'
  const [currentMedicine, setCurrentMedicine] = useState({


    name: "",
    generic_name: "",
    company: "",
    category_type: "Tablet",
    category: "",
    batch_no: "",
    manufacture_date: "",
    expiry_date: "",
    stock: "",
    min_stock: "10",
    max_stock: "1000",
    unit: "strip",
    cost_price: "",
    selling_price: "",
    mrp: "",
    status: "In Stock",
    is_active: true,
    description: "",
    storage_conditions: "",
    image: null,
    created_by: "",
    updated_by: "",
    // Bonus fields
    bonus_name: "",
    bonus_buy_quantity: "",
    bonus_free_quantity: "",
    bonus_start_date: "",
    bonus_end_date: "",
    bonus_is_active: true,
    // Scheme fields
    scheme_name: "",
    scheme_min_bill_amount: "",
    scheme_gift_value_limit: "",
    scheme_description: "",
    scheme_start_date: "",
    scheme_end_date: "",
    scheme_is_active: true,
    scheme_gifts: []
  });

  const getNotifTitle = (type) => {
    switch (type) {
      case "medicine": return "New Medicine";
      case "bonus": return "New Bonus";
      case "scheme": return "New Scheme";
      case "expiry": return "Expiry Request";
      case "complaint": return "Complaint Issue";
      default: return "Notification";
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/api/notifications/");
      const data = response.data.results || response.data;
      setNotifications(data.map(n => ({
        title: getNotifTitle(n.notification_type),
        message: n.message,
        type: n.notification_type,
        time: new Date(n.created_at).toLocaleTimeString(),
        isRead: n.is_read
      })));
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAsRead = async () => {
    try {
      if (unreadCount === 0) return;
      await api.post("/api/notifications/mark-read/");
      setUnreadCount(0);
      setNotifications([]); // Clear notifications once they are seen
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);

    socket.onopen = () => {
      console.log("Admin connected to notification socket");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setNotifications((prev) => [
        {
          title: getNotifTitle(data.notification_type),
          message: data.message,
          type: data.notification_type,
          time: new Date().toLocaleTimeString(),
          isRead: false
        },
        ...prev,
      ]);

      setUnreadCount((prev) => prev + 1);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("Admin notification socket closed");
    };

    return () => socket.close();
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch medicines from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMedicines();
      } catch (err) {
        setError("Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/inventory/medicines/");
      const meds = response.data.results || response.data;
      setMedicines(meds);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      if (error.response?.status === 401) window.location.href = "/login";
    }
  };



  const resetForm = () => {
    setCurrentMedicine({
      name: "",
      generic_name: "",
      company: "",
      category_type: "Tablet",
      category: "",
      batch_no: "",
      manufacture_date: "",
      expiry_date: "",
      stock: "",
      min_stock: "10",
      max_stock: "1000",
      unit: "strip",
      cost_price: "",
      selling_price: "",
      mrp: "",
      status: "In Stock",
      is_active: true,
      description: "",
      storage_conditions: "",
      image: null,
      created_by: "",
      updated_by: "",
      // Bonus fields
      bonus_name: "",
      bonus_buy_quantity: "",
      bonus_free_quantity: "",
      bonus_start_date: "",
      bonus_end_date: "",
      bonus_is_active: true,
      // Scheme fields
      scheme_name: "",
      scheme_min_bill_amount: "",
      scheme_gift_value_limit: "",
      scheme_description: "",
      scheme_start_date: "",
      scheme_end_date: "",
      scheme_is_active: true,
      scheme_gifts: []
    });
  };

  const handleAddMedicine = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditMedicine = (medicine) => {
    setIsEditMode(true);
    setCurrentMedicine({
      ...medicine,
      category_type: medicine.category_type || "Tablet",
      generic_name: medicine.generic_name ?? "",
      category: medicine.category ?? "",
      description: medicine.description ?? "",
      storage_conditions: medicine.storage_conditions ?? "",
      image: medicine.image || null,
      created_by: medicine.created_by ?? "",
      updated_by: medicine.updated_by ?? "",
      manufacture_date: (medicine.manufacture_date ?? "").slice(0, 10),
      expiry_date: (medicine.expiry_date ?? "").slice(0, 10),
      stock: medicine.stock ?? "",
      min_stock: medicine.min_stock ?? "10",
      max_stock: medicine.max_stock ?? "1000",
      unit: medicine.unit ?? "strip",
      cost_price: medicine.cost_price ?? "",
      selling_price: medicine.selling_price ?? "",
      mrp: medicine.mrp ?? "",
      status: medicine.status ?? "In Stock",
      is_active: medicine.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await api.delete(`/inventory/medicines/${id}/`);
        setMedicines(medicines.filter((m) => m.id !== id));
      } catch (error) {
        console.error("Error deleting medicine:", error);
        alert("Failed to delete medicine");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields including image
    if (!currentMedicine.name.trim()) {
      alert('Medicine name is required');
      return;
    }

    if (!currentMedicine.company.trim()) {
      alert('Company name is required');
      return;
    }

    if (!currentMedicine.batch_no.trim()) {
      alert('Batch number is required');
      return;
    }

    try {
      const fd = new FormData();
      const skip = new Set(["id", "created_at", "updated_at", "status", "created_by", "updated_by"]);

      Object.entries(currentMedicine).forEach(([key, value]) => {
        if (skip.has(key)) return;

        if (key === "image") {
          // Handle image upload
          if (value instanceof File) {
            // New image file selected
            fd.append("image", value);
            console.log('Adding new image file:', value.name);
          } else if (typeof value === 'string' && value) {
            // Existing image URL - don't send it back, let backend preserve it
            console.log('Preserving existing image');
          } else if (!value && isEditMode) {
            // No image selected during edit - preserve existing
            console.log('No new image selected, preserving existing');
          } else if (!value && !isEditMode) {
            // No image selected during creation - this is allowed
            console.log('No image selected for new medicine');
          }
          return;
        }

        if (value === null || value === undefined) return;
        if (typeof value === "boolean") {
          fd.append(key, value ? "true" : "false");
          return;
        }

        fd.append(key, value);
      });
      ["stock", "min_stock", "max_stock", "cost_price", "selling_price", "mrp"].forEach((f) => {
        const v = fd.get(f);
        if (v === null) return;
        if (v === "") {
          if (["stock", "min_stock", "max_stock"].includes(f)) fd.set(f, "0");
          return;
        }
        fd.set(f, String(parseFloat(v) || 0));
      });
      // Config for FormData - set Content-Type to undefined to allow browser to set it with boundary
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of fd.entries()) {
        console.log(key, value);
      }

      let response;
      if (isEditMode) {
        response = await api.patch(`/inventory/medicines/${currentMedicine.id}/`, fd, config);
        setMedicines(medicines.map((m) => (m.id === currentMedicine.id ? response.data : m)));
        alert('Medicine updated successfully!');
      } else {
        response = await api.post("/inventory/medicines/", fd, config);
        setMedicines([...medicines, response.data]);
        alert('Medicine added successfully!');
      }

      setIsModalOpen(false);
      resetForm();
      setIsEditMode(false);
      await fetchMedicines();
    } catch (error) {
      console.error("Error saving medicine:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.data) {
        const errorData = error.response.data;
        let msg = "Failed to save medicine:\n";
        if (typeof errorData === "object") {
          Object.keys(errorData).forEach((k) => {
            const v = errorData[k];
            msg += Array.isArray(v) ? `${k}: ${v.join(", ")}\n` : `${k}: ${v}\n`;
          });
        } else {
          msg += errorData;
        }
        alert(msg);
      } else {
        alert("Failed to save medicine. Please check console for details.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    const numericFields = ["stock", "min_stock", "max_stock", "cost_price", "selling_price", "mrp"];
    let processedValue = value;

    if (type === "checkbox") processedValue = checked;
    else if (numericFields.includes(name)) {
      if (value === "" || !isNaN(value)) processedValue = value;
      else return;
    }

    setCurrentMedicine({ ...currentMedicine, [name]: processedValue });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "#10b981";
      case "Low Stock":
        return "#f59e0b";
      case "Out of Stock":
        return "#ef4444";
      case "Expired":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const categoryTypeOptions = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler", "Other"];
  const unitOptions = ["strip", "bottle", "box", "tube", "vial", "pack"];
  const statusOptions = ["In Stock", "Low Stock", "Out of Stock", "Expired"];

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) => {
      const hay = `${m.name} ${m.company} ${m.batch_no} ${m.generic_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [medicines, search]);

  const stats = useMemo(() => {
    const total = medicines.length;
    const low = medicines.filter((m) => Number(m.stock) <= Number(m.min_stock)).length;
    const expired = medicines.filter((m) => {
      const exp = new Date(m.expiry_date);
      return !isNaN(exp.getTime()) && exp < new Date();
    }).length;
    return { total, low, expired };
  }, [medicines]);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊", active: activeTab === 'dashboard' },
    { key: "inv", label: "Inventory", icon: "📦", active: activeTab === 'inventory' },
    { key: "bonuses", label: "Bonuses", icon: "🏷️", active: activeTab === 'bonuses' },
    { key: "schemes", label: "Schemes", icon: "🎁", active: activeTab === 'schemes' },
    { key: "applied-schemes", label: "Applied Schemes", icon: "✅", active: activeTab === 'applied-schemes' },
    { key: "orders", label: "Orders", icon: "🧺", active: activeTab === 'orders' },
    { key: "expiry-return", label: "Expiry Return", icon: "🔄", active: activeTab === 'expiry-return' },
    { key: "complaints", label: "Complaints", icon: "📢", active: activeTab === 'complaints' },
    { key: "delivery", label: "Delivery", icon: "🚚", active: activeTab === 'delivery' },
    { key: "settings", label: "Settings", icon: "⚙️", active: activeTab === 'settings' },
  ];

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="inv-shell">
      {/* Mobile overlay */}
      <div
        className={`inv-overlay ${mobileSidebarOpen ? "show" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />


      <aside className={`inv-sidebar ${sidebarOpen ? "open" : "collapsed"} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="inv-side-top">
          <div className="inv-brand">
            <div className="inv-brand__logo">✚</div>
            {sidebarOpen ? <div className="inv-brand__text">Medistock Pro</div> : null}
          </div>

          <button
            className="inv-side-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {sidebarOpen ? "⟨" : "⟩"}
          </button>
        </div>

        <nav className="inv-nav">
          {navItems.map((it) => (
            <button
              key={it.key}
              className={`inv-nav-item ${it.active ? "active" : ""}`}
              type="button"
              onClick={() => {
                if (['inv', 'bonuses', 'schemes', 'applied-schemes'].includes(it.key)) {
                  setActiveTab(it.key === 'inv' ? 'inventory' : it.key);
                } else {
                  setActiveTab(it.key);
                }
              }}
            >
              <span className="inv-nav-ic">{it.icon}</span>
              {sidebarOpen ? <span className="inv-nav-text">{it.label}</span> : null}
              {it.active ? <span className="inv-nav-dot" /> : null}
            </button>
          ))}
        </nav>

        <div className="inv-side-bottom">
          <div className="inv-admin-card">
            <div className="inv-admin-avatar">A</div>
            {sidebarOpen ? (
              <div className="inv-admin-meta">
                <div className="inv-admin-name">Admin</div>
                <div className="inv-admin-sub">Inventory Manager</div>
              </div>
            ) : null}
          </div>

          <button
            className="inv-logout-btn"
            type="button"
            onClick={logout}
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>

          <button
            className="inv-mobile-close"
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
          >
            Close
          </button>
        </div>
      </aside>


      <main className="inv-main">
        {/* Top header */}
        <header className="inv-topbar">
          <button
            className="inv-burger"
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>

          <div className="inv-title">
            <h1>
              {activeTab === 'dashboard' && 'Admin Dashboard'}
              {activeTab === 'inventory' && 'Medicine Inventory'}
              {activeTab === 'orders' && 'Orders'}
              {activeTab === 'delivery' && 'Delivery Order Tracking'}
              {activeTab === 'bonuses' && 'Bonus Management'}
              {activeTab === 'schemes' && 'Scheme Management'}
              {activeTab === 'applied-schemes' && 'Applied Schemes'}
              {activeTab === 'expiry-return' && 'Expiry Return Requests'}
              {activeTab === 'complaints' && 'Complaint issues'}
            </h1>
            <p>
              {activeTab === 'dashboard' && 'Overview of inventory, sales, and system analytics.'}
              {activeTab === 'inventory' && 'Manage medicines, stock, pricing and expiry.'}
              {activeTab === 'orders' && 'View and manage customer orders.'}
              {activeTab === 'delivery' && 'Monitor live status of all customer orders.'}
              {activeTab === 'bonuses' && 'View and manage customer Bonuses.'}
              {activeTab === 'schemes' && 'View and manage customer Schemes.'}
              {activeTab === 'applied-schemes' && 'View all schemes applied by customers.'}
              {activeTab === 'expiry-return' && 'View and manage medicine expiry return requests from customers.'}
              {activeTab === 'complaints' && 'Review and manage customer complaints regarding medicines or service.'}
            </p>
          </div>

          <div className="inv-actions">
            {activeTab === 'inventory' && (
              <>
                <div className="inv-search">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search medicine / batch / company..."
                  />
                </div>
                <button className="add-medicine-btn" onClick={handleAddMedicine}>
                  + Add Medicine
                </button>
              </>
            )}

            {/*  NOTIFICATIONS */}
            <div className="notif-wrap">
              <button
                className="notif-btn"
                onClick={() => {
                  if (showNotifications) {
                    // Mark as read when closing
                    markAsRead();
                  }
                  setShowNotifications(!showNotifications);
                }}
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notif-badge" key={unreadCount}>
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className={`notif-dd ${showNotifications ? "open" : ""}`}>
                <div className="notif-head">
                  <div className="notif-title">Notifications</div>
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-item">
                      <div>No notifications</div>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div className="notif-item" key={i}>
                        <div className="notif-ic"><FaBell /></div>
                        <div>
                          <div className="notif-item-title">{n.title}</div>
                          <div className="notif-item-text">{n.message}</div>
                          <small style={{ opacity: 0.6, fontSize: '10px' }}>{n.time}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {showNotifications && (
                <div
                  className="notif-backdrop"
                  onClick={() => setShowNotifications(false)}
                />
              )}
            </div>
          </div>
        </header>

        {activeTab === 'inventory' && (
          <section className="inv-stats">
            <div className="inv-stat">
              <div className="inv-stat__label">Total Medicines</div>
              <div className="inv-stat__value">{stats.total}</div>
            </div>
            <div className="inv-stat">
              <div className="inv-stat__label">Low Stock</div>
              <div className="inv-stat__value">{stats.low}</div>
            </div>
            <div className="inv-stat">
              <div className="inv-stat__label">Expired</div>
              <div className="inv-stat__value">{stats.expired}</div>
            </div>
          </section>
        )}

        {/* Content based on active tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-table-wrapper">
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Medicine</th>
                    <th>Company</th>
                    <th>Batch</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine) => (
                    <tr key={medicine.id}>
                      <td>
                        {medicine.image ? (
                          <img src={medicine.image} alt={medicine.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '50px', height: '50px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                            <span style={{ color: '#9ca3af' }}>💊</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="medicine-info">
                          <strong>{medicine.name}</strong>
                          {medicine.generic_name && <small className="generic-name">{medicine.generic_name}</small>}
                        </div>
                      </td>
                      <td>{medicine.company}</td>
                      <td>{medicine.batch_no}</td>
                      <td>
                        <span className="category-badge">{medicine.category_type}</span>
                      </td>
                      <td>
                        {medicine.category}
                      </td>
                      <td>
                        <div className="stock-info">
                          <span>{medicine.stock}</span>
                          <div className="stock-range">
                            <small>Min: {medicine.min_stock}</small>
                            <small>Max: {medicine.max_stock}</small>
                          </div>
                        </div>
                      </td>
                      <td>{medicine.unit}</td>
                      <td>
                        <div className="price-info">
                          <span className="selling-price">Rs{medicine.selling_price}</span>
                          <small className="cost-price">Cost: Rs{medicine.cost_price}</small>
                        </div>
                      </td>
                      <td>{new Date(medicine.expiry_date).toLocaleDateString()}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(medicine.status) }}>
                          {medicine.status}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button className="btn-update" onClick={() => handleEditMedicine(medicine)}>
                          Update
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteMedicine(medicine.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="inv-empty">
                        No medicines found for: <b>{search}</b>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'bonuses' && <BonusManagement />}
        {activeTab === 'schemes' && <SchemeManagement />}
        {activeTab === 'applied-schemes' && <AppliedSchemes />}
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'expiry-return' && <ExpiryReturnRequests />}
        {activeTab === 'complaints' && <ComplaintsRequests />}
        {activeTab === 'delivery' && <DeliveryOrderStatus />}

        {/* Modal */}
        {isModalOpen && (
          <div className="inv-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="inv-modal open" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditMode ? "Edit Medicine" : "Add New Medicine"}</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Basic */}
                <div className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Medicine Name *</label>
                      <input type="text" name="name" value={currentMedicine.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Generic Name</label>
                      <input
                        type="text"
                        name="generic_name"
                        value={currentMedicine.generic_name ?? ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Company Name *</label>
                      <input
                        type="text"
                        name="company"
                        value={currentMedicine.company}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch No *</label>
                      <input
                        type="text"
                        name="batch_no"
                        value={currentMedicine.batch_no}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category Type *</label>
                      <select name="category_type" value={currentMedicine.category_type} onChange={handleInputChange} required>
                        {categoryTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Category</label>
                      <input
                        type="text"
                        name="category"
                        value={currentMedicine.category || ""}
                        onChange={handleInputChange}
                        placeholder="Enter category"
                      />
                    </div>
                  </div>
                </div>

                {/* Batch */}
                <div className="form-section">
                  <h3>Batch Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Manufacture Date *</label>
                      <input
                        type="date"
                        name="manufacture_date"
                        value={currentMedicine.manufacture_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={currentMedicine.expiry_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="form-section">
                  <h3>Stock Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Stock Quantity *</label>
                      <input
                        type="number"
                        name="stock"
                        value={currentMedicine.stock}
                        onChange={handleInputChange}
                        required
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit *</label>
                      <select name="unit" value={currentMedicine.unit} onChange={handleInputChange} required>
                        {unitOptions.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Minimum Stock</label>
                      <input type="number" name="min_stock" value={currentMedicine.min_stock} onChange={handleInputChange} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Maximum Stock</label>
                      <input type="number" name="max_stock" value={currentMedicine.max_stock} onChange={handleInputChange} min="0" />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="form-section">
                  <h3>Pricing Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cost Price *</label>
                      <input
                        type="number"
                        name="cost_price"
                        value={currentMedicine.cost_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Selling Price *</label>
                      <input
                        type="number"
                        name="selling_price"
                        value={currentMedicine.selling_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>MRP *</label>
                      <input
                        type="number"
                        name="mrp"
                        value={currentMedicine.mrp}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={currentMedicine.status} onChange={handleInputChange}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional */}
                <div className="form-section">
                  <h3>Additional Information</h3>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={currentMedicine.description ?? ""}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Storage Conditions</label>
                    <input
                      type="text"
                      name="storage_conditions"
                      value={currentMedicine.storage_conditions ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Medicine Image</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size should be less than 5MB');
                            e.target.value = ''; // Clear the input
                            return;
                          }

                          // Validate file type
                          if (!file.type.startsWith('image/')) {
                            alert('Please select a valid image file');
                            e.target.value = ''; // Clear the input
                            return;
                          }

                          setCurrentMedicine(prev => ({
                            ...prev,
                            image: file
                          }));
                          console.log('Image file selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
                        } else {
                          // File selection was cancelled
                          setCurrentMedicine(prev => ({
                            ...prev,
                            image: isEditMode ? prev.image : null
                          }));
                        }
                      }}
                    />
                    <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                      JPG, PNG, GIF supported. Maximum 5MB.
                    </small>
                    {currentMedicine.image && (
                      <div className="image-preview" style={{ marginTop: '10px' }}>
                        <img
                          src={
                            typeof currentMedicine.image === 'string' ? currentMedicine.image :
                              currentMedicine.image instanceof File ? URL.createObjectURL(currentMedicine.image) : ''
                          }
                          alt="Medicine Preview"
                          style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                          {currentMedicine.image instanceof File
                            ? `Selected: ${currentMedicine.image.name} (${(currentMedicine.image.size / 1024 / 1024).toFixed(2)} MB)`
                            : 'Existing image will be preserved'
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group checkbox-row">
                    <label className="checkline">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={!!currentMedicine.is_active}
                        onChange={handleInputChange}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {isEditMode ? "Update Medicine" : "Add Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
