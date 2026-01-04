import { useEffect, useState } from 'react';
import api from '../../../services/api.js';
import './Inventory.css';

const Inventory = () => {
  // Updated initial data structure to match backend
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    generic_name: '',
    company: '',
    category_type: 'Tablet',
    category: '',
    batch_no: '',
    manufacture_date: '',
    expiry_date: '',
    stock: '',
    min_stock: '10',
    max_stock: '1000',
    unit: 'strip',
    cost_price: '',
    selling_price: '',
    mrp: '',
    status: 'In Stock',
    is_active: true,
    description: '',
    storage_conditions: '',
    created_by: '',
    updated_by: ''
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch medicines from API
  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/inventory/medicines/');
      // Handle paginated response (DRF returns {results: [...], count: X, ...})
      const medicines = response.data.results || response.data;
      setMedicines(medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        window.location.href = '/login';
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/inventory/categories/');
      // Handle paginated response (DRF returns {results: [...], count: X, ...})
      const categories = response.data.results || response.data;
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        window.location.href = '/login';
      }
    }
  };

  const handleAddMedicine = () => {
    setIsEditMode(false);
    setCurrentMedicine({
      name: '',
      generic_name: '',
      company: '',
      category_type: 'Tablet',
      category: '',
      batch_no: '',
      manufacture_date: '',
      expiry_date: '',
      stock: '',
      min_stock: '10',
      max_stock: '1000',
      unit: 'strip',
      cost_price: '',
      selling_price: '',
      mrp: '',
      status: 'In Stock',
      is_active: true,
      description: '',
      storage_conditions: '',
      created_by: '',
      updated_by: ''
    });
    setIsModalOpen(true);
  };

  const handleEditMedicine = (medicine) => {
    setIsEditMode(true);
    // Convert backend field names to frontend format
    setCurrentMedicine({
      ...medicine,
      category: medicine.category || '',
      category_type: medicine.category_type || 'Tablet'
    });
    setIsModalOpen(true);
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/inventory/medicines/${id}/`);
        setMedicines(medicines.filter(medicine => medicine.id !== id));
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert('Failed to delete medicine');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for API - convert empty strings to null/undefined and strings to numbers
      const formData = { ...currentMedicine };
      
      // Convert empty category string to null
      if (formData.category === '' || formData.category === null) {
        formData.category = null;
      } else {
        // Convert category ID to number if it's a string
        formData.category = parseInt(formData.category) || null;
      }
      
      // Convert numeric fields from strings to numbers
      const numericFields = ['stock', 'min_stock', 'max_stock', 'cost_price', 'selling_price', 'mrp'];
      numericFields.forEach(field => {
        if (formData[field] !== '' && formData[field] !== null && formData[field] !== undefined) {
          formData[field] = parseFloat(formData[field]) || 0;
        } else if (field === 'stock' || field === 'min_stock' || field === 'max_stock') {
          formData[field] = 0;
        } else {
          // For price fields, keep as is if empty (will be validated by backend)
          formData[field] = formData[field] === '' ? null : formData[field];
        }
      });
      
      // Convert empty strings to null for optional text fields
      const optionalTextFields = ['generic_name', 'description', 'storage_conditions'];
      optionalTextFields.forEach(field => {
        if (formData[field] === '') {
          formData[field] = null;
        }
      });
      
      // Remove fields that shouldn't be sent
      delete formData.id;
      delete formData.created_at;
      delete formData.updated_at;
      delete formData.category_name;
      delete formData.status; // Status is read-only and auto-calculated
      
      if (isEditMode) {
        // Update existing medicine
        const response = await api.put(`/inventory/medicines/${currentMedicine.id}/`, formData);
        setMedicines(medicines.map(medicine =>
          medicine.id === currentMedicine.id ? response.data : medicine
        ));
      } else {
        // Add new medicine
        const response = await api.post('/inventory/medicines/', formData);
        setMedicines([...medicines, response.data]);
      }
      setIsModalOpen(false);
      // Reset form
      setCurrentMedicine({
        name: '',
        generic_name: '',
        company: '',
        category_type: 'Tablet',
        category: '',
        batch_no: '',
        manufacture_date: '',
        expiry_date: '',
        stock: '',
        min_stock: '10',
        max_stock: '1000',
        unit: 'strip',
        cost_price: '',
        selling_price: '',
        mrp: '',
        status: 'In Stock',
        is_active: true,
        description: '',
        storage_conditions: '',
        created_by: '',
        updated_by: ''
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
      // Show detailed error message from backend
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        let errorMessage = 'Failed to save medicine:\n';
        
        // Format validation errors
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            const value = errorData[key];
            if (Array.isArray(value)) {
              errorMessage += `${key}: ${value.join(', ')}\n`;
            } else if (typeof value === 'string') {
              errorMessage += `${key}: ${value}\n`;
            } else {
              errorMessage += `${key}: ${JSON.stringify(value)}\n`;
            }
          });
        } else {
          errorMessage += errorData;
        }
        
        alert(errorMessage);
      } else {
        alert('Failed to save medicine. Please check the console for details.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle numeric fields - keep as string for input but validate
    const numericFields = ['stock', 'min_stock', 'max_stock', 'cost_price', 'selling_price', 'mrp'];
    let processedValue = value;
    
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (numericFields.includes(name)) {
      // For numeric fields, allow empty string or valid number
      if (value === '' || !isNaN(value)) {
        processedValue = value;
      } else {
        return; // Don't update if invalid number
      }
    }
    // Keep category as string in state - will be converted to null/number on submit
    
    setCurrentMedicine({
      ...currentMedicine,
      [name]: processedValue
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'In Stock': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      case 'Expired': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Category type options
  const categoryTypeOptions = [
    'Tablet', 'Capsule', 'Syrup', 'Injection',
    'Ointment', 'Drops', 'Inhaler', 'Other'
  ];

  // Unit options
  const unitOptions = [
    'strip', 'bottle', 'box', 'tube', 'vial', 'pack'
  ];

  // Status options
  const statusOptions = [
    'In Stock', 'Low Stock', 'Out of Stock', 'Expired'
  ];

  return (
    <div className="inventory-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="app-title">Medistock Pro</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item inventory-link">
            <span>📦</span>
            {sidebarOpen && <span>Inventory</span>}
          </div>
          <div className="nav-item">
            <span>👥</span>
            {sidebarOpen && <span>Customers</span>}
          </div>
          <div className="nav-item">
            <span>🚚</span>
            {sidebarOpen && <span>Delivery</span>}
          </div>
          <div className="nav-item">
            <span>⚙️</span>
            {sidebarOpen && <span>Settings</span>}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1>Medicine Inventory Management</h1>
          <button className="add-medicine-btn" onClick={handleAddMedicine}>
            + Add Medicine
          </button>
        </header>

        {/* Inventory Table - Updated with new fields */}
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Company</th>
                <th>Batch No</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(medicine => (
                <tr key={medicine.id}>
                  <td>
                    <div className="medicine-info">
                      <strong>{medicine.name}</strong>
                      {medicine.generic_name && (
                        <small className="generic-name">{medicine.generic_name}</small>
                      )}
                    </div>
                  </td>
                  <td>{medicine.company}</td>
                  <td>{medicine.batch_no}</td>
                  <td>
                    <span className="category-badge">
                      {medicine.category_type}
                    </span>
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
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(medicine.status) }}
                    >
                      {medicine.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-update"
                      onClick={() => handleEditMedicine(medicine)}
                    >
                      Update
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteMedicine(medicine.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Medicine Modal - Updated with all fields */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={currentMedicine.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Generic Name</label>
                    <input
                      type="text"
                      name="generic_name"
                      value={currentMedicine.generic_name}
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
                    <select
                      name="category_type"
                      value={currentMedicine.category_type}
                      onChange={handleInputChange}
                      required
                    >
                      {categoryTypeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={currentMedicine.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Batch Information Section */}
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

              {/* Stock Information Section */}
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
                    <select
                      name="unit"
                      value={currentMedicine.unit}
                      onChange={handleInputChange}
                      required
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Stock</label>
                    <input
                      type="number"
                      name="min_stock"
                      value={currentMedicine.min_stock}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Stock</label>
                    <input
                      type="number"
                      name="max_stock"
                      value={currentMedicine.max_stock}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
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
                    <select
                      name="status"
                      value={currentMedicine.status}
                      onChange={handleInputChange}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={currentMedicine.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Storage Conditions</label>
                  <input
                    type="text"
                    name="storage_conditions"
                    value={currentMedicine.storage_conditions}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={currentMedicine.is_active}
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
                  {isEditMode ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;