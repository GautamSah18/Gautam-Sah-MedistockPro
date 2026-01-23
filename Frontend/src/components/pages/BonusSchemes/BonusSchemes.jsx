import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGift, FaTag, FaInfoCircle, FaCheck } from 'react-icons/fa';
import api from '../../../services/api';
import TopNav from '../Dashboard/TopNav';
import './BonusSchemes.css';

const BonusSchemes = () => {
  const [bonuses, setBonuses] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedGifts, setSelectedGifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bonusesRes, schemesRes] = await Promise.all([
        api.get('/api/bonus-schemes/bonuses/active/'),
        api.get('/api/bonus-schemes/bill-schemes/')
      ]);
      
      console.log('Bonuses Response:', bonusesRes.data);
      console.log('Schemes Response:', schemesRes.data);
      
      // Handle paginated responses
      const bonusesData = Array.isArray(bonusesRes.data) 
        ? bonusesRes.data 
        : bonusesRes.data.results || [];
      
      const schemesData = Array.isArray(schemesRes.data) 
        ? schemesRes.data 
        : schemesRes.data.results || [];
      
      console.log('Processed Bonuses:', bonusesData);
      console.log('Processed Schemes:', schemesData);
      
      setBonuses(bonusesData);
      setSchemes(schemesData);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load bonuses and schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScheme = (scheme) => {
    setSelectedScheme(scheme);
    setSelectedGifts([]);
    setShowModal(true);
  };

  const handleGiftSelect = (gift) => {
    setSelectedGifts(prev => {
      const isSelected = prev.some(g => g.id === gift.id);
      if (isSelected) {
        return prev.filter(g => g.id !== gift.id);
      } else {
        // Check if adding this gift would exceed the limit
        const totalValue = [...prev, gift].reduce((sum, g) => sum + parseFloat(g.value), 0);
        if (totalValue <= selectedScheme.gift_value_limit) {
          return [...prev, gift];
        }
        return prev;
      }
    });
  };

  const getTotalSelectedValue = () => {
    return selectedGifts.reduce((sum, gift) => sum + parseFloat(gift.value), 0);
  };

  const handleConfirmSelection = () => {
    // Here you would typically send the selection to backend
    console.log('Selected gifts:', selectedGifts);
    console.log('Total value:', getTotalSelectedValue());
    alert(`Selected gifts worth Rs ${getTotalSelectedValue()} for scheme: ${selectedScheme.name}`);
    setShowModal(false);
    setSelectedGifts([]);
    setSelectedScheme(null);
  };

  if (loading) {
    return (
      <div className="bonus-schemes-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading bonuses and schemes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mdp">
      <TopNav 
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onCartClick={() => console.log('Cart clicked')}
        onAddToCart={() => console.log('Add to cart')}
      />
      
      <div className="bonus-schemes-page">
        <div className="page-header">
          <h1>Bonus & Schemes</h1>
          <p>Discover amazing offers and rewards on your purchases</p>
        </div>

      {error && (
        <div className="error-message">
          <FaInfoCircle /> {error}
        </div>
      )}

      <div className="content-sections">
        {/* Bonuses Section */}
        <section className="bonuses-section">
          <div className="section-header">
            <h2><FaTag /> Active Bonuses</h2>
            <p>Special item-level offers available now</p>
          </div>
          
          {(bonuses || []).length === 0 ? (
            <div className="empty-state">
              <FaTag size={48} />
              <h3>No Active Bonuses</h3>
              <p>Check back later for exciting bonus offers!</p>
            </div>
          ) : (
            <div className="bonuses-grid">
              {(bonuses || []).map(bonus => (
                <div key={bonus.id} className="bonus-card">
                  <div className="bonus-header">
                    <h3>{bonus.name}</h3>
                    <span className="medicine-name">{bonus.medicine.name}</span>
                  </div>
                  <div className="bonus-details">
                    <div className="quantity-info">
                      <span className="buy-qty">Buy {bonus.buy_quantity}</span>
                      <span className="plus">+</span>
                      <span className="free-qty">Get {bonus.free_quantity} Free</span>
                    </div>
                    <div className="medicine-company">{bonus.medicine.company}</div>
                  </div>
                  <div className="bonus-footer">
                    <span className="valid-until">
                      Valid until: {new Date(bonus.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Schemes Section */}
        <section className="schemes-section">
          <div className="section-header">
            <h2><FaGift /> Available Schemes</h2>
            <p>Bill-level rewards for large purchases</p>
          </div>
          
          {(schemes || []).length === 0 ? (
            <div className="empty-state">
              <FaGift size={48} />
              <h3>No Available Schemes</h3>
              <p>Stay tuned for exciting scheme announcements!</p>
            </div>
          ) : (
            <div className="schemes-grid">
              {(schemes || []).map(scheme => (
                <div key={scheme.id} className="scheme-ticket">
                  <div className="ticket-header">
                    <h3>{scheme.name}</h3>
                    <div className="min-amount">
                      Min. Bill: <strong>Rs {scheme.min_bill_amount.toLocaleString()}</strong>
                    </div>
                  </div>
                  
                  <div className="ticket-body">
                    {scheme.description && (
                      <p className="scheme-description">{scheme.description}</p>
                    )}
                    
                    <div className="gift-limit">
                      <FaGift /> Gift Selection Limit: <strong>Rs {scheme.gift_value_limit.toLocaleString()}</strong>
                    </div>
                    
                    <div className="available-gifts">
                      <h4>Available Gifts ({(scheme.gifts || []).length}):</h4>
                      <div className="gifts-preview">
                        {(scheme.gifts || []).slice(0, 3).map(gift => (
                          <span key={gift.id} className="gift-tag">
                            {gift.name}
                          </span>
                        ))}
                        {(scheme.gifts || []).length > 3 && (
                          <span className="more-gifts">
                            +{(scheme.gifts || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ticket-footer">
                    <button 
                      className="apply-btn"
                      onClick={() => handleApplyScheme(scheme)}
                    >
                      Apply Scheme
                    </button>
                    <div className="valid-dates">
                      Valid: {new Date(scheme.start_date).toLocaleDateString()} - {new Date(scheme.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal for Gift Selection */}
      {showModal && selectedScheme && (
        <div className="modal-overlay">
          <div className="gift-selection-modal">
            <div className="modal-header">
              <h2>Select Your Gifts</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="scheme-info">
                <h3>{selectedScheme.name}</h3>
                <p>Max Gift Value: Rs {selectedScheme.gift_value_limit.toLocaleString()}</p>
                <p>Current Selection: Rs {getTotalSelectedValue().toLocaleString()}</p>
                <div className="remaining-value">
                  Remaining: Rs {(selectedScheme.gift_value_limit - getTotalSelectedValue()).toLocaleString()}
                </div>
              </div>
              
              <div className="gifts-list">
                <h4>Choose from available gifts:</h4>
                {(selectedScheme.gifts || []).map(gift => {
                  const isSelected = selectedGifts.some(g => g.id === gift.id);
                  const wouldExceedLimit = getTotalSelectedValue() + parseFloat(gift.value) > selectedScheme.gift_value_limit;
                  
                  return (
                    <div 
                      key={gift.id} 
                      className={`gift-item ${isSelected ? 'selected' : ''} ${wouldExceedLimit && !isSelected ? 'disabled' : ''}`}
                      onClick={() => !wouldExceedLimit && handleGiftSelect(gift)}
                    >
                      {isSelected && <FaCheck className="check-icon" />}
                      <div className="gift-info">
                        <h5>{gift.name}</h5>
                        <p>{gift.description}</p>
                        <span className="gift-value">Rs {gift.value.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleConfirmSelection}
                disabled={selectedGifts.length === 0}
              >
                Confirm Selection ({selectedGifts.length} items)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BonusSchemes;
