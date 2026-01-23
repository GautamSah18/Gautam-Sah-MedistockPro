import { useEffect, useState } from 'react';
import api from '../../../services/api';

const SchemeManagement = () => {
  const [schemes, setSchemes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_bill_amount: '',
    gift_value_limit: '',
    gifts: [],
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
      const [schemesRes, giftsRes] = await Promise.all([
        api.get('/api/bonus-schemes/bill-schemes/'),
        api.get('/api/bonus-schemes/gifts/')
      ]);
      
      setSchemes(schemesRes.data.results || schemesRes.data);
      setGifts(giftsRes.data.results || giftsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
  };

  const handleGiftToggle = (giftId) => {
    setFormData(prev => {
      const giftIdNum = parseInt(giftId);
      const currentGifts = prev.gifts.map(id => parseInt(id));
      const isSelected = currentGifts.includes(giftIdNum);
      
      return {
        ...prev,
        gifts: isSelected 
          ? currentGifts.filter(id => id !== giftIdNum)
          : [...currentGifts, giftIdNum]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        min_bill_amount: parseFloat(formData.min_bill_amount),
        gift_value_limit: parseFloat(formData.gift_value_limit),
        gift_ids: formData.gifts.map(id => parseInt(id))
      };

      if (editingScheme) {
        await api.put(`/api/bonus-schemes/bill-schemes/${editingScheme.id}/`, payload);
      } else {
        await api.post('/api/bonus-schemes/bill-schemes/', payload);
      }
      
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving scheme:', error);
      if (error.response && error.response.data) {
        console.error('Validation errors:', error.response.data);
        // Show specific error messages
        const errorMessages = Object.entries(error.response.data)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        alert(`Failed to save scheme:\n${errorMessages}`);
      } else {
        alert('Failed to save scheme. Please check the console for details.');
      }
    }
  };

  const handleEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      description: scheme.description || '',
      min_bill_amount: scheme.min_bill_amount.toString(),
      gift_value_limit: scheme.gift_value_limit.toString(),
      gifts: scheme.gifts.map(g => g.id),
      start_date: scheme.start_date.split('T')[0],
      end_date: scheme.end_date.split('T')[0],
      is_active: scheme.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scheme?')) {
      try {
        await api.delete(`/api/bonus-schemes/bill-schemes/${id}/`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting scheme:', error);
        alert('Failed to delete scheme');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      min_bill_amount: '',
      gift_value_limit: '',
      gifts: [],
      start_date: '',
      end_date: '',
      is_active: true
    });
    setEditingScheme(null);
    setShowForm(false);
  };

  const getTotalGiftValue = (schemeGifts) => {
    return schemeGifts.reduce((sum, gift) => sum + parseFloat(gift.value), 0);
  };

  if (loading) {
    return <div className="loading">Loading schemes...</div>;
  }

  return (
    <div className="scheme-management">
      <div className="management-header">
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Scheme'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingScheme ? 'Edit Scheme' : 'Add New Scheme'}</h3>
          <form onSubmit={handleSubmit} className="scheme-form">
            <div className="form-row">
              <div className="form-group">
                <label>Scheme Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Minimum Bill Amount (Rs) *</label>
                <input
                  type="number"
                  name="min_bill_amount"
                  value={formData.min_bill_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gift Value Limit (Rs) *</label>
                <input
                  type="number"
                  name="gift_value_limit"
                  value={formData.gift_value_limit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
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
            </div>

            <div className="form-row">
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

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe the scheme..."
              />
            </div>

            <div className="form-group">
              <label>Available Gifts</label>
              <div className="gifts-selection">
                {gifts.map(gift => {
                  const isSelected = formData.gifts.includes(gift.id);
                  return (
                    <div 
                      key={gift.id} 
                      className={`gift-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleGiftToggle(gift.id)}
                    >
                      <div className="gift-info">
                        <strong>{gift.name}</strong>
                        <span>Rs{gift.value}</span>
                      </div>
                      <div className="gift-desc">{gift.description}</div>
                    </div>
                  );
                })}
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
                {editingScheme ? 'Update Scheme' : 'Create Scheme'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <h3>Active Schemes</h3>
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Min Bill (Rs)</th>
              <th>Gift Limit (Rs)</th>
              <th>Gifts</th>
              <th>Total Gift Value</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(scheme => (
              <tr key={scheme.id}>
                <td>{scheme.name}</td>
                <td>Rs{scheme.min_bill_amount.toLocaleString()}</td>
                <td>Rs{scheme.gift_value_limit.toLocaleString()}</td>
                <td>{scheme.gifts.length} gifts</td>
                <td>Rs{getTotalGiftValue(scheme.gifts).toLocaleString()}</td>
                <td>{new Date(scheme.start_date).toLocaleDateString()}</td>
                <td>{new Date(scheme.end_date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${scheme.is_active ? 'active' : 'inactive'}`}>
                    {scheme.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEdit(scheme)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(scheme.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {schemes.length === 0 && (
              <tr>
                <td colSpan="9" className="empty-row">
                  No schemes found. Create your first scheme above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchemeManagement;