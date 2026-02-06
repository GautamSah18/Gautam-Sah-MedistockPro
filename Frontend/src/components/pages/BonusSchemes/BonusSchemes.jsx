import { useEffect, useState } from 'react';
import { FaCheck, FaGift, FaInfoCircle, FaTag } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import TopNav from '../Dashboard/TopNav';
import './BonusSchemes.css';

const BonusSchemes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { cart = [], cartTotal = 0, selectedScheme: navScheme = null } = location.state || {};

  const [bonuses, setBonuses] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [initialScheme, setInitialScheme] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedGifts, setSelectedGifts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const num = (v) => Number(v ?? 0);
  const money = (v) => num(v).toLocaleString();

  const schemeLimit = (scheme) =>
    num(scheme?.remaining_gift_value ?? scheme?.total_gift_value ?? scheme?.gift_value_limit ?? 0);

  const isEligibleForScheme = (scheme) => {
    // Check if scheme is unlocked based on customer's purchase history
    const isUnlocked = scheme?.unlocked !== undefined ? scheme.unlocked : true;
    return isUnlocked;
  };

  const getTotalSelectedValue = () =>
    selectedGifts.reduce((sum, gift) => sum + num(gift?.value), 0);

  const handleBonusClick = async (bonus) => {
    try {
      const medId = bonus?.medicine?.id ?? bonus?.medicine_id ?? bonus?.medicine;
      if (!medId) return;

      const medRes = await api.get(`/api/inventory/public/medicines/${medId}/`);
      const med = medRes.data;

      navigate('/customerDashboard', {
        state: {
          openCart: true,
          bonusAdd: {
            id: med.id,
            name: med.name,
            company: med.company || '',
            price: num(med.selling_price || med.mrp || 0),
            buy_quantity: bonus.buy_quantity,
            free_quantity: bonus.free_quantity,
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (navScheme && !initialScheme) {
      if (!isEligibleForScheme(navScheme)) return;
      setInitialScheme(navScheme);
      setSelectedScheme(navScheme);
      setShowModal(true);
    }
  }, [navScheme, initialScheme, cartTotal]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (cart && Array.isArray(cart)) {
      setCartCount(cart.reduce((acc, item) => acc + (item.qty || 0), 0));
    } else {
      setCartCount(0);
    }
  }, [cart]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [bonusesRes, schemesRes] = await Promise.all([
        api.get('/api/bonus-schemes/bonuses/active/'),
        api.get('/api/bonus-schemes/bill-schemes/'),
      ]);

      const bonusesData = Array.isArray(bonusesRes.data) ? bonusesRes.data : bonusesRes.data.results || [];
      const schemesData = Array.isArray(schemesRes.data) ? schemesRes.data : schemesRes.data.results || [];

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
    if (!isEligibleForScheme(scheme)) return;
    setSelectedScheme(scheme);
    setSelectedGifts([]);
    setShowModal(true);
  };

  const handleGiftSelect = (gift) => {
    setSelectedGifts((prev) => {
      const isSelected = prev.some((g) => g.id === gift.id);
      if (isSelected) return prev.filter((g) => g.id !== gift.id);

      const totalValue = [...prev, gift].reduce((sum, g) => sum + num(g?.value), 0);
      const limit = schemeLimit(selectedScheme);

      if (selectedScheme && totalValue <= limit) return [...prev, gift];
      return prev;
    });
  };

  const handleConfirmSelection = async () => {
    try {
      const limit = schemeLimit(selectedScheme);
      const selectedTotal = getTotalSelectedValue();

      if (selectedTotal > limit) {
        alert(`Selected gifts exceed limit of Rs ${money(limit)}`);
        return;
      }

      const res = await api.post('/api/bonus-schemes/apply-scheme/', {
        scheme_id: selectedScheme.id,
        gift_ids: selectedGifts.map((g) => g.id),
      });

      alert(`Scheme applied! Gifts value Rs ${money(res.data.total_gift_value)}`);

      setSchemes((prev) => prev.filter((s) => s.id !== selectedScheme.id));
      setShowModal(false);
      setSelectedGifts([]);
      setSelectedScheme(null);

      sessionStorage.setItem('selectedScheme', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || err?.response?.data?.error || 'Error applying scheme.');
    }
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
        onCartClick={() => navigate('/customerDashboard')}
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
          <section className="bonuses-section">
            <div className="section-header">
              <h2>
                <FaTag /> Active Bonuses
              </h2>
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
                {(bonuses || []).map((bonus) => (
                  <div
                    key={bonus.id}
                    className="bonus-card"
                    onClick={() => handleBonusClick(bonus)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bonus-header">
                      <h3>{bonus.name}</h3>
                      <span className="medicine-name">{bonus?.medicine?.name ?? 'Unknown Medicine'}</span>
                    </div>

                    <div className="bonus-details">
                      <div className="quantity-info">
                        <span className="buy-qty">Buy {bonus.buy_quantity}</span>
                        <span className="plus">+</span>
                        <span className="free-qty">Get {bonus.free_quantity} Free</span>
                      </div>
                      <div className="medicine-company">{bonus?.medicine?.company ?? ''}</div>
                    </div>

                    <div className="bonus-footer">
                      <span className="valid-until">
                        Valid until: {bonus?.end_date ? new Date(bonus.end_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="schemes-section">
            <div className="section-header">
              <h2>
                <FaGift /> Available Schemes
              </h2>
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
                {(schemes || []).map((scheme) => {
                  const eligible = isEligibleForScheme(scheme);
                  const remaining = Math.max(0, num(scheme?.remaining_to_unlock || 0));
                  const customerTotal = num(scheme?.customer_total_purchase || 0);

                  return (
                    <div key={scheme.id} className="scheme-ticket">
                      <div className="ticket-header">
                        <h3>{scheme.name}</h3>
                        <div className="min-amount">
                          Min. Bill: <strong>Rs {money(scheme.min_bill_amount)}</strong>
                        </div>
                      </div>

                      <div className="ticket-body">
                        {scheme.description && <p className="scheme-description">{scheme.description}</p>}

                        <div className="gift-limit">
                          <FaGift /> Gift Selection Limit: <strong>Rs {money(schemeLimit(scheme))}</strong>
                        </div>

                        <div className="available-gifts">
                          <h4>Available Gifts ({(scheme.gifts || []).length}):</h4>
                          <div className="gifts-preview">
                            {(scheme.gifts || []).slice(0, 3).map((gift) => (
                              <span key={gift.id} className="gift-tag">
                                {gift.name}
                              </span>
                            ))}
                            {(scheme.gifts || []).length > 3 && (
                              <span className="more-gifts">+{(scheme.gifts || []).length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ticket-footer">
                        {eligible ? (
                          <button className="apply-btn" onClick={() => handleApplyScheme(scheme)}>
                            Apply Scheme
                          </button>
                        ) : (
                          <div className="not-eligible-text">Add Rs {money(remaining)} more to unlock (Current: Rs {money(customerTotal)})</div>
                        )}

                        <div className="valid-dates">
                          Valid: {scheme?.start_date ? new Date(scheme.start_date).toLocaleDateString() : '—'} -{' '}
                          {scheme?.end_date ? new Date(scheme.end_date).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {showModal && selectedScheme && (
          <div className="modal-overlay">
            <div className="gift-selection-modal">
              <div className="modal-header">
                <h2>Select Your Gifts</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="scheme-info">
                  <h3>{selectedScheme.name}</h3>
                  {(() => {
                    const limit = schemeLimit(selectedScheme);
                    const selected = getTotalSelectedValue();
                    return (
                      <>
                        <p>Max Gift Value: Rs {money(limit)}</p>
                        <p>Current Selection: Rs {money(selected)}</p>
                        <div className="remaining-value">Remaining: Rs {money(limit - selected)}</div>
                      </>
                    );
                  })()}
                </div>

                <div className="gifts-list">
                  <h4>Choose from available gifts:</h4>

                  {(selectedScheme.gifts || []).map((gift) => {
                    const isSelected = selectedGifts.some((g) => g.id === gift.id);
                    const limit = schemeLimit(selectedScheme);
                    const wouldExceedLimit = getTotalSelectedValue() + num(gift?.value) > limit;

                    return (
                      <div
                        key={gift.id}
                        className={`gift-item ${isSelected ? 'selected' : ''} ${
                          wouldExceedLimit && !isSelected ? 'disabled' : ''
                        }`}
                        onClick={() => !wouldExceedLimit && handleGiftSelect(gift)}
                      >
                        {isSelected && <FaCheck className="check-icon" />}
                        <div className="gift-info">
                          <h5>{gift.name}</h5>
                          <p>{gift.description}</p>
                          <span className="gift-value">Rs {money(gift.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={handleConfirmSelection} disabled={selectedGifts.length === 0}>
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
