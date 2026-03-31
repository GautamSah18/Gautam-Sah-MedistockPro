import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function MedicineStock() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/inventory/medicines/");
      setMedicines(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching medicines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    
    // Refresh stock every 15 seconds to simulate dynamic stock tracking
    const interval = setInterval(() => {
        fetchMedicines();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredMeds = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: 'bold' }}>Medicine Stock Levels</h2>
        <input 
          type="text" 
          placeholder="Search by name or company..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', width: '250px' }}
        />
      </div>

      {loading ? (
        <p>Loading stock levels...</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '15px' }}>Medicine Name</th>
                <th style={{ padding: '15px' }}>Company</th>
                <th style={{ padding: '15px' }}>Stock Available</th>
                <th style={{ padding: '15px' }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '15px' }}>
              {filteredMeds.length > 0 ? (
                filteredMeds.map((med, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                     <td style={{ padding: '15px', fontWeight: '500', color: '#111827' }}>{med.name}</td>
                     <td style={{ padding: '15px', color: '#6b7280' }}>{med.company || 'N/A'}</td>
                     <td style={{ padding: '15px' }}>
                        <span style={{ 
                            fontWeight: 'bold', 
                            color: med.stock > med.min_stock ? '#10b981' : (med.stock > 0 ? '#f59e0b' : '#ef4444') 
                        }}>
                           {med.stock} Items
                        </span>
                     </td>
                     <td style={{ padding: '15px' }}>
                        {med.stock > 0 ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>In Stock</span>
                        ) : (
                            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Out of Stock</span>
                        )}
                     </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>No medicines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
