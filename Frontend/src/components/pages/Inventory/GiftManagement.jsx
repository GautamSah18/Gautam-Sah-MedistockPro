import { useEffect, useState } from 'react';
import api from '../../../services/api';

const GiftManagement = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    is_active: true,
  });

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/bonus-schemes/gifts/manage/');
      setGifts(res.data.results || res.data);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
      };

      if (editingGift) {
        await api.put(`/api/bonus-schemes/gifts/${editingGift.id}/`, payload);
      } else {
        await api.post('/api/bonus-schemes/gifts/manage/', payload);
      }

      await fetchGifts();
      resetForm();
    } catch (error) {
      console.error('Error saving gift:', error);
      if (error.response?.data) {
        const msgs = Object.entries(error.response.data)
          .map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`)
          .join('\n');
        alert(`Failed to save gift:\n${msgs}`);
      } else {
        alert('Failed to save gift. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name,
      description: gift.description || '',
      value: gift.value.toString(),
      is_active: gift.is_active,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gift?')) return;
    try {
      await api.delete(`/api/bonus-schemes/gifts/${id}/`);
      await fetchGifts();
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Failed to delete gift.');
    }
  };

  const handleToggleActive = async (gift) => {
    try {
      await api.put(`/api/bonus-schemes/gifts/${gift.id}/`, {
        ...gift,
        is_active: !gift.is_active,
      });
      await fetchGifts();
    } catch (error) {
      console.error('Error toggling gift status:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', value: '', is_active: true });
    setEditingGift(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading gifts...</div>;

  return (
    <div className="scheme-management">
      <div className="management-header">
        <button
          className="btn-primary"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
        >
          {showForm ? 'Cancel' : '+ Add Gift'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingGift ? 'Edit Gift' : 'Add New Gift'}</h3>
          <form onSubmit={handleSubmit} className="scheme-form">
            <div className="form-row">
              <div className="form-group">
                <label>Gift Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Water Bottle, Umbrella"
                  required
                />
              </div>
              <div className="form-group">
                <label>Value (Rs) *</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 500"
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
                placeholder="Optional description of the gift..."
              />
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
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingGift ? 'Update Gift' : 'Create Gift'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <h3>All Gifts</h3>
        <table className="management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Gift Name</th>
              <th>Description</th>
              <th>Value (Rs)</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((gift, index) => (
              <tr key={gift.id}>
                <td>{index + 1}</td>
                <td><strong>{gift.name}</strong></td>
                <td>{gift.description || '—'}</td>
                <td>Rs {parseFloat(gift.value).toLocaleString()}</td>
                <td>
                  <span
                    className={`status-badge ${gift.is_active ? 'active' : 'inactive'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleActive(gift)}
                    title="Click to toggle"
                  >
                    {gift.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(gift.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(gift)}>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(gift.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {gifts.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-row">
                  No gifts found. Add your first gift above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GiftManagement;