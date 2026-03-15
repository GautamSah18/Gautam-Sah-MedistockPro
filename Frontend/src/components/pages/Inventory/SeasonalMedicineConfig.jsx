import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { FaTrash } from 'react-icons/fa';

export default function SeasonalMedicineConfig() {
  const [seasonalMeds, setSeasonalMeds] = useState([]);
  const [allMeds, setAllMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('Winter');
  const [selectedMedId, setSelectedMedId] = useState('');

  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];

  useEffect(() => {
    fetchData();
  }, [selectedSeason]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seasonalRes, medsRes] = await Promise.all([
        api.get(`/api/inventory/seasonal/?season=${selectedSeason}`),
        api.get('/api/inventory/medicines/')
      ]);
      setSeasonalMeds(seasonalRes.data.results || seasonalRes.data);
      setAllMeds(medsRes.data.results || medsRes.data);
    } catch (err) {
      console.error("Error fetching seasonal medicines", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedMedId) {
      alert("Please select a medicine.");
      return;
    }
    
    // Check if mapping already exists
    if (seasonalMeds.some(sm => sm.medicine.toString() === selectedMedId)) {
        alert("This medicine is already mapped to this season!");
        return;
    }

    try {
      await api.post('/api/inventory/seasonal/', {
        medicine: parseInt(selectedMedId),
        season: selectedSeason
      });
      alert(`Mapped successfully to ${selectedSeason}!`);
      fetchData();
    } catch (err) {
      console.error("Error creating mapping", err);
      alert("Failed to map medicine. It might already be mapped to this season.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this mapping?")) return;
    try {
      await api.delete(`/api/inventory/seasonal/${id}/`);
      setSeasonalMeds(seasonalMeds.filter(sm => sm.id !== id));
      alert("Mapping removed successfully!");
    } catch (err) {
      console.error("Error deleting mapping", err);
      alert("Failed to remove mapping.");
    }
  };

  return (
    <div className="section" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: 'bold' }}>Seasonal Medicine Configuration</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Map medicines to their relevant seasons to automatically display them on the customer dashboard and monitor seasonal stock levels.
      </p>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Select Season:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {seasons.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #20b46a',
                  backgroundColor: selectedSeason === s ? '#20b46a' : 'transparent',
                  color: selectedSeason === s ? '#fff' : '#20b46a',
                  cursor: 'pointer',
                  fontWeight: selectedSeason === s ? 'bold' : 'normal'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div style={{ flex: '1' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Add new medicine to {selectedSeason}:</label>
          <select 
            value={selectedMedId} 
            onChange={(e) => setSelectedMedId(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          >
            <option value="">-- Select a medicine --</option>
            {allMeds.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.company})</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleCreate}
          style={{ padding: '10px 20px', backgroundColor: '#20b46a', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Save Mapping
        </button>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Current {selectedSeason} Medicines</h3>
      
      {loading ? (
        <p>Loading mappings...</p>
      ) : seasonalMeds.length === 0 ? (
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
          No medicines have been mapped to {selectedSeason} yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {seasonalMeds.map(sm => {
            const med = sm.medicine_details || allMeds.find(m => m.id === sm.medicine) || { name: 'Unknown', company: '' };
            return (
              <div key={sm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1b1f2a' }}>{med.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{med.company || med.generic_name}</div>
                </div>
                <button 
                  onClick={() => handleDelete(sm.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                  title="Remove mapping"
                >
                  <FaTrash />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
