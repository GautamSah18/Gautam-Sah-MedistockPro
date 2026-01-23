import React, { useState, useEffect } from 'react';
import { FaGift, FaTimes } from 'react-icons/fa';
import { checkSchemeEligibility } from '../services/bonusSchemesService';

const CartSchemePopup = ({ cartTotal, isVisible, onClose }) => {
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && cartTotal > 0) {
      checkEligibility();
    }
  }, [isVisible, cartTotal]);

  const checkEligibility = async () => {
    if (cartTotal <= 0) return;
    
    setLoading(true);
    try {
      const response = await checkSchemeEligibility(cartTotal);
      setEligibleSchemes(response.eligible_schemes || []);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setEligibleSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || eligibleSchemes.length === 0) {
    return null;
  }

  return (
    <div className="cart-popup-overlay">
      <div className="cart-scheme-popup">
        <div className="popup-header">
          <div className="header-icon">
            <FaGift />
          </div>
          <h2>Congratulations!</h2>
          <button className="close-popup" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="popup-body">
          <p className="congrats-message">
            Your cart total is <strong>Rs {cartTotal.toLocaleString()}</strong>.
            You are eligible for exciting reward schemes!
          </p>
          
          <div className="scheme-instruction">
            <p>Visit the <strong>Bonus & Schemes</strong> page from the navigation menu to apply your eligible schemes and receive rewards.</p>
          </div>
          
          {loading ? (
            <div className="loading-schemes">
              <div className="spinner-small"></div>
              <p>Checking available schemes...</p>
            </div>
          ) : (
            <div className="eligible-schemes-list">
              <h3>You qualify for:</h3>
              {eligibleSchemes.map(scheme => (
                <div key={scheme.id} className="scheme-preview">
                  <div className="scheme-name">{scheme.name}</div>
                  <div className="scheme-details">
                    <span>Min. Bill: Rs {scheme.min_bill_amount.toLocaleString()}</span>
                    <span>Gift Limit: Rs {scheme.gift_value_limit.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="popup-footer">
          <button className="primary-btn" onClick={onClose}>
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSchemePopup;
