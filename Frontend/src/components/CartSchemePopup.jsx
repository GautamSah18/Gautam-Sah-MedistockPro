import { useEffect, useMemo, useState } from "react";
import { FaGift, FaTimes } from "react-icons/fa";
import api from "../services/api";

const CartSchemePopup = ({ cartTotal = 0, isVisible, onClose, onApplyScheme }) => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const money = (v) => Number(v ?? 0).toLocaleString();

  const schemeGiftLimit = (s) =>
    Number(s?.remaining_gift_value ?? s?.total_gift_value ?? s?.gift_value_limit ?? 0);

  const isActiveToday = (s) => {
    const now = new Date();
    const startOk = s?.start_date ? new Date(s.start_date) <= now : true;
    const endOk = s?.end_date ? new Date(s.end_date) >= now : true;
    const activeOk = s?.is_active === undefined ? true : Boolean(s.is_active);
    return startOk && endOk && activeOk;
  };

  useEffect(() => {
    if (!isVisible) return;

    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await api.get("/api/bonus-schemes/bill-schemes/");
        const all = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setSchemes(all);
      } catch (e) {
        console.error("Error loading schemes:", e);
        setLoadError("Failed to load schemes.");
        setSchemes([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isVisible]);

  const eligibleSchemes = useMemo(() => {
    return (schemes || [])
      .filter(isActiveToday)
      .filter((s) => s?.unlocked === true)
      .sort((a, b) => Number(a.min_bill_amount || 0) - Number(b.min_bill_amount || 0));
  }, [schemes]);

  const handleApply = (scheme) => {
    if (typeof onApplyScheme === "function") onApplyScheme(scheme);
    if (typeof onClose === "function") onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="cart-popup-overlay">
      <div className="cart-scheme-popup">
        <div className="popup-header">
          <div className="header-icon">
            <FaGift />
          </div>
          <h2>Reward Schemes</h2>
          <button className="close-popup" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="popup-body">
          <p className="congrats-message">
            Your cart total is <strong>Rs {money(cartTotal)}</strong>.
          </p>

          {loading ? (
            <p>Please wait... checking schemes</p>
          ) : loadError ? (
            <p>{loadError}</p>
          ) : eligibleSchemes.length > 0 ? (
            <div className="schemes-list">
              <h3>Available Schemes:</h3>

              {eligibleSchemes.map((scheme) => (
                <div key={scheme.id} className="scheme-item">
                  <div className="scheme-info">
                    <div className="scheme-name">{scheme.name}</div>
                    <div className="scheme-details">
                      <span>Min. Bill: Rs {money(scheme.min_bill_amount)}</span>
                      <span>Gift Limit: Rs {money(schemeGiftLimit(scheme))}</span>
                    </div>
                  </div>

                  <button className="apply-scheme-btn" onClick={() => handleApply(scheme)}>
                    Apply Scheme
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No schemes available for this total.</p>
          )}
        </div>

        <div className="popup-footer">
          <button className="secondary-btn" onClick={onClose}>
            Skip for Now
          </button>
          <button className="primary-btn" onClick={onClose}>
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSchemePopup;
