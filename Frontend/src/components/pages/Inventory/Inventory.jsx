import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api.js";
import "./Inventory.css";

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
    created_by: "",
    updated_by: "",
  });

  // ✅ New UI states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch medicines from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchMedicines(), fetchCategories()]);
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

  const fetchCategories = async () => {
    try {
      const response = await api.get("/inventory/categories/");
      const cats = response.data.results || response.data;
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      created_by: "",
      updated_by: "",
    });
  };

  const handleAddMedicine = () => {
    setIsEditMode(false);
    resetForm();
    setIsModalOpen(true);
  };

  // ✅ Fix textarea null + date normalization
  const handleEditMedicine = (medicine) => {
    setIsEditMode(true);
    setCurrentMedicine({
      ...medicine,
      category: medicine.category || "",
      category_type: medicine.category_type || "Tablet",
      generic_name: medicine.generic_name ?? "",
      description: medicine.description ?? "",
      storage_conditions: medicine.storage_conditions ?? "",
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
    try {
      const formData = { ...currentMedicine };

      if (formData.category === "" || formData.category === null) {
        formData.category = null;
      } else {
        formData.category = parseInt(formData.category) || null;
      }

      const numericFields = ["stock", "min_stock", "max_stock", "cost_price", "selling_price", "mrp"];
      numericFields.forEach((field) => {
        if (formData[field] !== "" && formData[field] !== null && formData[field] !== undefined) {
          formData[field] = parseFloat(formData[field]) || 0;
        } else if (field === "stock" || field === "min_stock" || field === "max_stock") {
          formData[field] = 0;
        } else {
          formData[field] = formData[field] === "" ? null : formData[field];
        }
      });

      const optionalTextFields = ["generic_name", "description", "storage_conditions"];
      optionalTextFields.forEach((field) => {
        if (formData[field] === "") formData[field] = null;
      });

      delete formData.id;
      delete formData.created_at;
      delete formData.updated_at;
      delete formData.category_name;
      delete formData.status; // keep your behavior

      let response;
      if (isEditMode) {
        response = await api.put(`/inventory/medicines/${currentMedicine.id}/`, formData);
        setMedicines(medicines.map((m) => (m.id === currentMedicine.id ? response.data : m)));
      } else {
        response = await api.post("/inventory/medicines/", formData);
        setMedicines([...medicines, response.data]);
      }

      setIsModalOpen(false);
      resetForm();
      setIsEditMode(false);

      await fetchMedicines();
    } catch (error) {
      console.error("Error saving medicine:", error);

      if (error.response && error.response.data) {
        const errorData = error.response.data;
        let errorMessage = "Failed to save medicine:\n";
        if (typeof errorData === "object") {
          Object.keys(errorData).forEach((key) => {
            const value = errorData[key];
            if (Array.isArray(value)) errorMessage += `${key}: ${value.join(", ")}\n`;
            else if (typeof value === "string") errorMessage += `${key}: ${value}\n`;
            else errorMessage += `${key}: ${JSON.stringify(value)}\n`;
          });
        } else {
          errorMessage += errorData;
        }
        alert(errorMessage);
      } else {
        alert("Failed to save medicine. Please check the console for details.");
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

  // ✅ New: search + stats
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
    { key: "inv", label: "Inventory", icon: "📦", active: true },
    { key: "cat", label: "Categories", icon: "🧾", active: false },
    { key: "orders", label: "Orders", icon: "🧺", active: false },
    { key: "delivery", label: "Delivery", icon: "🚚", active: false },
    { key: "settings", label: "Settings", icon: "⚙️", active: false },
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

      {/* ✅ New Sidebar (rail → expanded drawer) */}
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
              onClick={() => {}}
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
            className="inv-mobile-close"
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
          >
            Close
          </button>
        </div>
      </aside>

      {/* ✅ Main */}
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
            <h1>Medicine Inventory</h1>
            <p>Manage medicines, stock, pricing and expiry.</p>
          </div>

          <div className="inv-actions">
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
          </div>
        </header>

        {/* ✅ Stats cards */}
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

        {/* Table */}
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Company</th>
                <th>Batch</th>
                <th>Type</th>
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
                  <td colSpan={10} className="inv-empty">
                    No medicines found for: <b>{search}</b>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

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
                      <select name="category" value={currentMedicine.category} onChange={handleInputChange}>
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
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
