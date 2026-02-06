import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const BonusManagement = () => {
  const [bonuses, setBonuses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    medicine: '',
    buy_quantity: '',
    free_quantity: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching bonus data...');
      
      const [bonusesRes, medicinesRes] = await Promise.all([
        api.get('/api/bonus-schemes/bonuses/'),
        api.get('/api/inventory/medicines/')
      ]);
      
      console.log('Bonuses response:', bonusesRes.data);
      console.log('Medicines response:', medicinesRes.data);
      
      setBonuses(bonusesRes.data.results || bonusesRes.data || []);
      setMedicines(medicinesRes.data.results || medicinesRes.data || []);
      
      console.log('Processed bonuses:', bonusesRes.data.results || bonusesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      // Show user-friendly error message
      alert('Failed to load bonuses. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Log the change for debugging
    console.log(`Field ${name} changed to:`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.medicine) {
      alert('Please select a medicine');
      return;
    }
    
    if (!formData.buy_quantity || parseInt(formData.buy_quantity) < 1) {
      alert('Buy quantity must be at least 1');
      return;
    }
    
    if (!formData.free_quantity || parseInt(formData.free_quantity) < 1) {
      alert('Free quantity must be at least 1');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        medicine_id: parseInt(formData.medicine),
        buy_quantity: parseInt(formData.buy_quantity),
        free_quantity: parseInt(formData.free_quantity)
      };

      console.log('Submitting bonus:', payload);

      if (editingBonus) {
        await api.put(`/api/bonus-schemes/bonuses/${editingBonus.id}/`, payload);
      } else {
        await api.post('/api/bonus-schemes/bonuses/', payload);
      }
      
      await fetchData();
      resetForm();
      alert(editingBonus ? 'Bonus updated successfully!' : 'Bonus created successfully!');
    } catch (error) {
      console.error('Error saving bonus:', error);
      console.error('Error response:', error.response?.data);
      if (error.response && error.response.data) {
        const errorMessages = Object.entries(error.response.data)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        alert(`Failed to save bonus:\n${errorMessages}`);
      } else {
        alert('Failed to save bonus. Please check the console for details.');
      }
    }
  };

  const handleEdit = (bonus) => {
    setEditingBonus(bonus);
    setFormData({
      name: bonus.name,
      medicine: bonus.medicine?.id?.toString() || '',
      buy_quantity: bonus.buy_quantity.toString(),
      free_quantity: bonus.free_quantity.toString(),
      start_date: bonus.start_date?.split('T')[0] || '',
      end_date: bonus.end_date?.split('T')[0] || '',
      is_active: bonus.is_active !== undefined ? bonus.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bonus?')) {
      try {
        await api.delete(`/api/bonus-schemes/bonuses/${id}/`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting bonus:', error);
        alert('Failed to delete bonus');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      medicine: '',
      buy_quantity: '',
      free_quantity: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
    setEditingBonus(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading bonuses...</div>;
  }

  return (
    <div className="bonus-management">
      <div className="management-header">
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Bonus'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingBonus ? 'Edit Bonus' : 'Add New Bonus'}</h3>
          <form onSubmit={handleSubmit} className="bonus-form">
            <div className="form-row">
              <div className="form-group">
                <label>Bonus Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Medicine *</label>
                <select
                  name="medicine"
                  value={formData.medicine}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Medicine</option>
                  {medicines.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} {med.company ? `- ${med.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Buy Quantity *</label>
                <input
                  type="number"
                  name="buy_quantity"
                  value={formData.buy_quantity}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Free Quantity *</label>
                <input
                  type="number"
                  name="free_quantity"
                  value={formData.free_quantity}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingBonus ? 'Update Bonus' : 'Create Bonus'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <h3>Active Bonuses</h3>
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Medicine</th>
              <th>Buy Qty</th>
              <th>Free Qty</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bonuses.map(bonus => (
              <tr key={bonus.id}>
                <td>{bonus.name || 'N/A'}</td>
                <td>{bonus.medicine?.name || 'Unknown Medicine'}</td>
                <td>{bonus.buy_quantity || 0}</td>
                <td>{bonus.free_quantity || 0}</td>
                <td>{bonus.start_date ? new Date(bonus.start_date).toLocaleDateString() : 'N/A'}</td>
                <td>{bonus.end_date ? new Date(bonus.end_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`status-badge ${bonus.is_active ? 'active' : 'inactive'}`}>
                    {bonus.is_active === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEdit(bonus)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(bonus.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {bonuses.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-row">
                  {loading ? 'Loading...' : 'No bonuses found. Create your first bonus above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BonusManagement;