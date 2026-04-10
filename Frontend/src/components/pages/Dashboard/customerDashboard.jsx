import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CartSchemePopup from "../../../components/CartSchemePopup";
import api from "../../../services/api.js";
import "./customerDashboard.css";
import TopNav from "./TopNav";

import {
  FaArrowRight,
  FaBoxOpen,
  FaClock,
  FaCreditCard,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMinus,
  FaMoneyBillWave,
  FaPhone,
  FaPlus,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartRef = useRef(null);

  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payType, setPayType] = useState("cash");
  const [cart, setCart] = useState([]);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSchemePopup, setShowSchemePopup] = useState(false);
  const [appliedScheme, setAppliedScheme] = useState(null);
  const [checkingSchemes, setCheckingSchemes] = useState(false);

  const [seasonalMedicines, setSeasonalMedicines] = useState([]);
  const [currentSeason, setCurrentSeason] = useState("Seasonal");

  const [activeBonuses, setActiveBonuses] = useState([]);
  const [activeSchemes, setActiveSchemes] = useState([]);

  const tones = ["mint", "lavender", "butter", "rose", "mint", "lavender"];
  const tagColors = ["green", "blue", "orange", "red", "green", "blue"];

  const dynamicOffers = useMemo(() => {
    const combined = [];

    activeSchemes.forEach((s) => {
      combined.push({
        type: "scheme",
        tag: "SCHEME",
        title: `${s.name}`,
        subtitle: `Min Bill Rs ${Number(s.min_bill_amount || 0).toLocaleString()}`,
        cta: "View Scheme",
        data: s,
      });
    });

    activeBonuses.forEach((b) => {
      combined.push({
        type: "bonus",
        tag: "BONUS",
        title: `Buy ${b.buy_quantity} Get ${b.free_quantity} Free`,
        subtitle: `On ${b.medicine?.name || "selected medicines"}`,
        cta: "Claim Bonus",
        data: b,
      });
    });

    return combined.slice(0, 4).map((offer, idx) => ({
      ...offer,
      tone: tones[idx % tones.length],
      tagColor: tagColors[idx % tagColors.length],
    }));
  }, [activeBonuses, activeSchemes]);

  const handleSchemeApplied = (schemeData) => {
    setAppliedScheme(schemeData);
  };

  const calcFreeQty = (qty, buyQty, freeQty) => {
    const qn = Number(qty ?? 0);
    const buy = Number(buyQty ?? 0);
    const free = Number(freeQty ?? 0);
    if (!buy || !free) return 0;
    return Math.floor(qn / buy) * free;
  };

  const addToCart = (p, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      const buyQ = Number(p.buy_quantity ?? found?.buy_quantity ?? 0);
      const freeQ = Number(p.free_quantity ?? found?.free_quantity ?? 0);

      if (found) {
        const newQty = Number(found.qty) + Number(qty || 0);
        const bonusFree = calcFreeQty(newQty, buyQ, freeQ);

        return prev.map((x) =>
          x.id === p.id
            ? {
                ...x,
                qty: newQty,
                buy_quantity: buyQ || x.buy_quantity,
                free_quantity: freeQ || x.free_quantity,
                bonus_free_qty: bonusFree,
              }
            : x
        );
      }

      const price = p.price ?? p.selling_price ?? p.mrp ?? 0;
      const bonusFree = calcFreeQty(qty, buyQ, freeQ);

      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: Number(price) || 0,
          qty: Number(qty || 1),
          buy_quantity: buyQ,
          free_quantity: freeQ,
          bonus_free_qty: bonusFree,
        },
      ];
    });

    setCartOpen(true);
  };

  const inc = (id) =>
    setCart((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const newQty = x.qty + 1;
        const bonusFree = calcFreeQty(newQty, x.buy_quantity, x.free_quantity);
        return { ...x, qty: newQty, bonus_free_qty: bonusFree };
      })
    );

  const dec = (id) =>
    setCart((prev) =>
      prev
        .map((x) => {
          if (x.id !== id) return x;
          const newQty = Math.max(1, x.qty - 1);
          const bonusFree = calcFreeQty(newQty, x.buy_quantity, x.free_quantity);
          return { ...x, qty: newQty, bonus_free_qty: bonusFree };
        })
        .filter((x) => x.qty > 0)
    );

  const removeItem = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const openProduct = (p) => setModalProduct(p);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/inventory/public/medicines/");
        setMedicines(response.data.results || response.data);
        setError(null);

        try {
          const seasonalRes = await api.get("/api/inventory/public/seasonal-medicines/");
          setSeasonalMedicines(seasonalRes.data.medicines || []);
          setCurrentSeason(seasonalRes.data.season || "Seasonal");
        } catch (e) {
          console.error("Error fetching seasonal medicines:", e);
        }

        try {
          const [bonusesRes, schemesRes] = await Promise.all([
            api.get("/api/bonus-schemes/bonuses/active/"),
            api.get("/api/bonus-schemes/bill-schemes/"),
          ]);

          const bData = Array.isArray(bonusesRes.data)
            ? bonusesRes.data
            : bonusesRes.data.results || [];
          const sData = Array.isArray(schemesRes.data)
            ? schemesRes.data
            : schemesRes.data.results || [];

          setActiveBonuses(bData);
          setActiveSchemes(sData);
        } catch (e) {
          console.error("Error fetching promos:", e);
        }
      } catch (err) {
        setError("Failed to load medicines. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    const bonusAdd = location.state?.bonusAdd;
    const openCartFlag = location.state?.openCart;

    if (bonusAdd?.id) {
      addToCart(
        {
          id: bonusAdd.id,
          name: bonusAdd.name,
          price: bonusAdd.price,
          buy_quantity: bonusAdd.buy_quantity,
          free_quantity: bonusAdd.free_quantity,
        },
        1
      );

      navigate(location.pathname, { replace: true, state: {} });
      setCartOpen(true);

      setTimeout(() => {
        cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else if (openCartFlag) {
      setCartOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const filteredMedicines = useMemo(() => {
    let result = medicines;
    const query = q.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => (p.name || "").toLowerCase().includes(query));
    }
    return result;
  }, [q, medicines]);

  const featuredMedicines = useMemo(() => filteredMedicines.slice(0, 8), [filteredMedicines]);
  const moreMedicines = useMemo(() => filteredMedicines.slice(0, 4), [filteredMedicines]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, it) => acc + it.qty * it.price, 0), [cart]);

  const formatMedicineForDisplay = (medicine) => ({
    id: medicine.id,
    name: medicine.name,
    price: Number(medicine.selling_price || medicine.mrp || 0),
    desc: medicine.description || "Medicine description not available",
    category: medicine.category_name || medicine.category_type || "General",
    company: medicine.company,
    generic_name: medicine.generic_name,
    stock: medicine.stock,
    status: medicine.status,
    image: medicine.image || medicine.image_url || null,
    buy_quantity: medicine.buy_quantity,
    free_quantity: medicine.free_quantity,
  });

  const fetchEligibleSchemes = async () => {
    const res = await api.get("/api/bonus-schemes/bill-schemes/");
    const all = Array.isArray(res.data) ? res.data : res.data.results || [];
    const now = new Date();

    return all.filter((s) => {
      const unlocked = s.unlocked === undefined ? true : Boolean(s.unlocked);
      const activeOk = s.is_active === undefined ? true : Boolean(s.is_active);
      const startOk = s.start_date ? new Date(s.start_date) <= now : true;
      const endOk = s.end_date ? new Date(s.end_date) >= now : true;
      return unlocked && activeOk && startOk && endOk;
    });
  };

  const renderMedicineCard = (medicine, keyPrefix = "") => {
    const fm = formatMedicineForDisplay(medicine);

    return (
      <article className="product-card modern-card" key={`${keyPrefix}${fm.id}`}>
        <button className="product-click" onClick={() => openProduct(fm)} aria-label="Open product">
          <div
            className="product-img modern-product-img"
            style={
              fm.image
                ? {
                    backgroundImage: `url(${fm.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background: "linear-gradient(135deg, #ffffff, #eefaf3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }
            }
          >
            {!fm.image && <span className="product-fallback">💊</span>}
          </div>
        </button>

        <div className="product-body modern-product-body">
          <div className="product-name">{fm.name}</div>
          <div className="product-meta">
            <div className="company">{fm.company || "Healthcare Brand"}</div>
          </div>

          <div className="product-stock modern-stock">
            Available:{" "}
            {fm.stock > 0 ? (
              `${fm.stock} items`
            ) : (
              <span className="stock-out">Out of Stock</span>
            )}
          </div>

          <div className="product-price">Rs {fm.price}</div>

          <button
            className="add-btn"
            onClick={() => addToCart(fm, 1)}
            disabled={fm.stock <= 0}
            style={
              fm.stock <= 0
                ? { backgroundColor: "#d1d5db", cursor: "not-allowed", color: "#6b7280" }
                : {}
            }
          >
            Add to Cart
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="mdp modern-dashboard">
      <TopNav
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onAddToCart={addToCart}
      />

      <CartSchemePopup
        cartTotal={cartTotal}
        isVisible={showSchemePopup}
        onClose={() => {
          setShowSchemePopup(false);
          setCheckoutOpen(true);
          setCartOpen(false);
        }}
        onApplyScheme={(scheme) => {
          handleSchemeApplied(scheme);
          navigate("/bonus-schemes", { state: { cart, cartTotal, selectedScheme: scheme } });
        }}
      />

      <main className="container modern-container">
        {loading && (
          <div className="loading modern-message-card">
            <div className="loading-text">Loading medicines...</div>
          </div>
        )}

        {error && (
          <div className="error modern-message-card error-card">
            <div className="error-text">{error}</div>
          </div>
        )}

        <section className="hero modern-hero">
          <div className="hero-overlay modern-hero-overlay" />
          <div className="hero-content modern-hero-content">
            <div className="hero-badge">Seasonal Health Offers</div>
            <h1>Stay healthy with smarter reorders and trusted essentials.</h1>
            <p>
              Discover top medicines, seasonal recommendations, active schemes,
              and customer support in one clean dashboard experience.
            </p>

            <div className="hero-actions">
              <button
                className="primary-btn"
                onClick={() =>
                  document.getElementById("medicines")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Explore Offers
              </button>

              <button
                className="secondary-hero-btn"
                onClick={() => navigate("/products")}
              >
                View Products
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-pill-card">
              <span>💊</span>
            </div>
            <div className="hero-pill-card offset">
              <span>🧴</span>
            </div>
            <div className="hero-pill-card">
              <span>🩺</span>
            </div>
            <div className="hero-pill-card offset">
              <span>📦</span>
            </div>
          </div>
        </section>

        <section className="hero-stats-grid">
          <div className="hero-stat-card">
            <div className="hero-stat-icon">
              <FaShieldAlt />
            </div>
            <div>
              <strong>Trusted Quality</strong>
              <p>Verified medicines and dependable supply.</p>
            </div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-icon">
              <FaClock />
            </div>
            <div>
              <strong>Fast Reordering</strong>
              <p>Repeat purchases with quicker cart flow.</p>
            </div>
          </div>

          <div className="hero-stat-card">
            <div className="hero-stat-icon">
              <FaBoxOpen />
            </div>
            <div>
              <strong>Live Promotions</strong>
              <p>Active schemes and bonus offers in one place.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header modern-section-header">
            <div>
              <div className="section-title">Schemes & Discounts</div>
              <div className="section-subtitle">
                Latest active offers designed to maximize savings.
              </div>
            </div>
          </div>

          {dynamicOffers.length === 0 && !loading ? (
            <div className="empty-offer-card">
              No active schemes or bonuses right now. Check back later.
            </div>
          ) : (
            <div className="scheme-grid modern-scheme-grid">
              {dynamicOffers.map((s, idx) => (
                <div
                  key={idx}
                  className={`scheme-card tone-${s.tone} modern-scheme-card`}
                  onClick={() => navigate("/bonus-schemes")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="scheme-card-top">
                    <div className={`scheme-tag tag-${s.tagColor}`}>{s.tag}</div>
                  </div>
                  <div className="scheme-title">{s.title}</div>
                  <div className="scheme-subtitle">{s.subtitle}</div>
                  <button
                    className="scheme-cta modern-inline-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/bonus-schemes");
                    }}
                  >
                    {s.cta} <FaArrowRight />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section modern-panel" id="medicines">
          <div className="section-header modern-section-header">
            <div>
              <div className="section-title">Medicines</div>
              <div className="section-subtitle">
                Quick reorder and add-to-cart actions for commonly searched products.
              </div>
            </div>
            <button className="view-all-btn" onClick={() => navigate("/products")}>
              View All
            </button>
          </div>

          <div className="product-grid">
            {!loading &&
              featuredMedicines.map((medicine) => renderMedicineCard(medicine, "featured-"))}

            {!loading && featuredMedicines.length === 0 && (
              <div className="no-results modern-empty-grid">
                <p>No medicines found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        <section className="modern-split-grid">
          <div className="winter modern-season-panel">
            <div className="section-header modern-section-header">
              <div>
                <div className="winter-title">{currentSeason} Medicines</div>
                <div className="section-subtitle">
                  Curated seasonal picks for customer convenience.
                </div>
              </div>

              <button className="text-link-btn" onClick={() => navigate("/products")}>
                Browse Category
              </button>
            </div>

            <div className="winter-grid modern-season-grid">
              {!loading &&
                seasonalMedicines.map((medicine) => {
                  const fm = formatMedicineForDisplay(medicine);
                  return (
                    <article className="winter-card modern-season-card" key={`seasonal-${fm.id}`}>
                      <div
                        className="winter-img modern-season-img"
                        style={
                          fm.image
                            ? {
                                backgroundImage: `url(${fm.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {
                                background: "linear-gradient(135deg, #ffffff, #eefaf3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }
                        }
                      >
                        {!fm.image && <span className="product-fallback">💊</span>}
                      </div>

                      <div className="winter-body">
                        <div className="winter-name">{fm.name}</div>
                        <div className="winter-sub">
                          {fm.desc.substring(0, 60)}
                          {fm.desc.length > 60 ? "..." : ""}
                        </div>
                        <div className="product-stock modern-stock">
                          Available:{" "}
                          {fm.stock > 0 ? (
                            `${fm.stock} items`
                          ) : (
                            <span className="stock-out">Out of Stock</span>
                          )}
                        </div>
                        <div className="winter-price">Rs {fm.price}</div>
                        <button
                          className="winter-add"
                          onClick={() =>
                            addToCart(
                              {
                                id: fm.id,
                                name: fm.name,
                                price: fm.price,
                                mrp: fm.price,
                                buy_quantity: medicine.buy_quantity,
                                free_quantity: medicine.free_quantity,
                              },
                              1
                            )
                          }
                          disabled={fm.stock <= 0}
                          style={
                            fm.stock <= 0
                              ? {
                                  backgroundColor: "#d1d5db",
                                  cursor: "not-allowed",
                                  color: "#6b7280",
                                }
                              : {}
                          }
                        >
                          Add to Cart
                        </button>
                      </div>
                    </article>
                  );
                })}

              {!loading && seasonalMedicines.length === 0 && (
                <div className="no-results modern-empty-grid">
                  <p>No seasonal medicines configured right now.</p>
                </div>
              )}
            </div>
          </div>

          <section className="about-us-section modern-about-panel" id="about">
            <div className="about-container modern-about-container">
              <div className="about-content">
                <div className="pill">About Us</div>
                <h2>Your Trusted Healthcare Partner</h2>
                <p>
                  At Medistock Pro, we are dedicated to providing high quality
                  pharmaceutical care and healthcare supplies. Our mission is to
                  make essential medicines accessible, affordable, and easy to order.
                </p>

                <div className="about-stats modern-about-stats">
                  <div className="stat-item">
                    <strong>10k+</strong>
                    <span>Products</span>
                  </div>
                  <div className="stat-item">
                    <strong>5k+</strong>
                    <span>Happy Customers</span>
                  </div>
                  <div className="stat-item">
                    <strong>24/7</strong>
                    <span>Support</span>
                  </div>
                  <div className="stat-item">
                    <strong>99%</strong>
                    <span>Order Accuracy</span>
                  </div>
                </div>

                <div className="service-meter">
                  <div className="service-meter__head">
                    <span>Service Reliability</span>
                    <strong>96%</strong>
                  </div>
                  <div className="service-meter__track">
                    <div className="service-meter__fill" />
                  </div>
                </div>
              </div>

            </div>
          </section>
        </section>

        <section className="section modern-panel top-selling-bottom">
          <div className="section-header modern-section-header">
            <div>
              <div className="section-title">More Medicines</div>
              <div className="section-subtitle">
                Explore additional products from our catalog.
              </div>
            </div>
          </div>

          <div className="product-grid compact-grid">
            {!loading &&
              moreMedicines.map((medicine) => renderMedicineCard(medicine, "more-"))}
          </div>
        </section>

        <section className="contact-us-section modern-contact-section" id="contact">
          <div className="section-header modern-section-header">
            <div>
              <div className="section-title">Get In Touch</div>
              <div className="section-subtitle">
                Questions about orders, returns, product availability, or support.
              </div>
            </div>
          </div>

          <div className="contact-grid modern-contact-grid">
            <div className="contact-info">
              <div className="contact-card modern-contact-card">
                <FaPhone className="contact-icon" />
                <div className="contact-details">
                  <h3>Call Us</h3>
                  <p>025-561152</p>
                </div>
              </div>

              <div className="contact-card modern-contact-card">
                <FaEnvelope className="contact-icon" />
                <div className="contact-details">
                  <h3>Email Us</h3>
                  <p>support@medistock.com</p>
                </div>
              </div>

              <div className="contact-card modern-contact-card">
                <FaMapMarkerAlt className="contact-icon" />
                <div className="contact-details">
                  <h3>Visit Us</h3>
                  <p>Main Street, Health City</p>
                </div>
              </div>
            </div>

            <div className="contact-form-container modern-form-panel">
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row two-col">
                  <div className="form-group">
                    <input type="text" placeholder="Your Name" required />
                  </div>
                  <div className="form-group">
                    <input type="email" placeholder="Your Email" required />
                  </div>
                </div>

                <div className="form-group">
                  <input type="text" placeholder="Subject" />
                </div>

                <div className="form-group">
                  <textarea placeholder="Your Message" rows="5" required></textarea>
                </div>

                <button type="submit" className="primary-btn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <div
        className={`drawer-backdrop ${cartOpen ? "show" : ""}`}
        onClick={() => setCartOpen(false)}
      />

      <aside
        ref={cartRef}
        className={`drawer ${cartOpen ? "open" : ""}`}
        aria-hidden={!cartOpen}
      >
        <div className="drawer-head">
          <div>
            <div className="drawer-title">Your Cart</div>
            <div className="drawer-sub">{cartCount} items</div>
          </div>
          <button className="drawer-close" onClick={() => setCartOpen(false)} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="empty-title">Cart is empty</div>
              <div className="empty-sub">Add some medicines to proceed.</div>
            </div>
          ) : (
            cart.map((it) => (
              <div className="cart-item" key={it.id}>
                <div className="cart-item__info">
                  <div className="cart-item__name">{it.name}</div>
                  <div className="cart-item__price">Rs {it.price}</div>
                </div>

                {Number(it.bonus_free_qty || 0) > 0 && (
                  <div className="bonus-note">
                    Bonus: {it.qty} + {it.bonus_free_qty} free
                  </div>
                )}

                <div className="cart-item__actions">
                  <button className="qty-btn" onClick={() => dec(it.id)} aria-label="Decrease">
                    <FaMinus />
                  </button>
                  <div className="qty">{it.qty}</div>
                  <button className="qty-btn" onClick={() => inc(it.id)} aria-label="Increase">
                    <FaPlus />
                  </button>
                  <button className="remove" onClick={() => removeItem(it.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="drawer-foot">
          <div className="total-row">
            <span>Total</span>
            <strong>Rs {cartTotal}</strong>
          </div>

          <button
            className={`checkout-btn ${cart.length === 0 || checkingSchemes ? "disabled" : ""}`}
            onClick={async () => {
              if (cart.length === 0 || checkingSchemes) return;

              try {
                setCheckingSchemes(true);
                const eligible = await fetchEligibleSchemes(cartTotal);

                if (eligible.length > 0) {
                  setShowSchemePopup(true);
                } else {
                  setCheckoutOpen(true);
                  setCartOpen(false);
                }
              } catch (e) {
                setCheckoutOpen(true);
                setCartOpen(false);
              } finally {
                setCheckingSchemes(false);
              }
            }}
          >
            {checkingSchemes ? "Checking Schemes..." : "Checkout"}
          </button>
        </div>
      </aside>

      <div
        className={`modal-backdrop ${modalProduct ? "show" : ""}`}
        onClick={() => setModalProduct(null)}
      />

      <div className={`modal ${modalProduct ? "open" : ""}`} role="dialog" aria-hidden={!modalProduct}>
        {modalProduct ? (
          <>
            <div className="modal-head">
              <div className="modal-title">Product Details</div>
              <button className="modal-close" onClick={() => setModalProduct(null)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div
                className="modal-img"
                style={
                  modalProduct.image
                    ? {
                        backgroundImage: `url(${modalProduct.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {
                        background: "linear-gradient(135deg, #ffffff, #eefaf3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "280px",
                      }
                }
              >
                {!modalProduct.image && <span className="modal-fallback">💊</span>}
              </div>

              <div className="modal-info">
                <div className="modal-name">{modalProduct.name}</div>
                <div className="modal-meta">
                  <div className="company">{modalProduct.company}</div>
                </div>

                <div className="pill">{modalProduct.category}</div>
                <p className="modal-desc">{modalProduct.desc}</p>

                <div className="modal-price">
                  <span>Price</span>
                  <strong>Rs {modalProduct.price}</strong>
                </div>

                <div className="modal-actions">
                  <button className="add-btn" onClick={() => addToCart(modalProduct, 1)}>
                    Add to Cart
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() => {
                      addToCart(modalProduct, 1);
                      setModalProduct(null);
                    }}
                  >
                    Add & Close
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div
        className={`modal-backdrop ${checkoutOpen ? "show" : ""}`}
        onClick={() => setCheckoutOpen(false)}
      />

      <div className={`checkout ${checkoutOpen ? "open" : ""}`} role="dialog" aria-hidden={!checkoutOpen}>
        <div className="modal-head">
          <div className="modal-title">Checkout</div>
          <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="checkout-body">
          <div className="pay-toggle">
            <button
              className={`pay-opt ${payType === "cash" ? "active" : ""}`}
              onClick={() => setPayType("cash")}
            >
              <FaMoneyBillWave /> Cash
            </button>

            <button
              className={`pay-opt ${payType === "credit" ? "active" : ""}`}
              onClick={() => setPayType("credit")}
            >
              <FaCreditCard /> Credit (2 months)
            </button>
          </div>

          {payType === "cash" ? (
            <div className="pay-panel">
              <div className="pay-title">Cash Payment</div>
              <div className="pay-text">Pay instantly after bill is generated.</div>
              <div className="bill">
                <div>Bill Total</div>
                <strong>Rs {cartTotal}</strong>
              </div>
            </div>
          ) : (
            <div className="pay-panel">
              <div className="pay-title">Credit Terms</div>
              <div className="pay-text">
                You have <b>2 months</b> to clear the bill. Late payment may restrict
                purchase and reduce discounts or bonuses.
              </div>
              <div className="bill">
                <div>Bill Total</div>
                <strong>Rs {cartTotal}</strong>
              </div>
              <div className="credit-note">
                If not paid in time: restrict in bonuses and discount.
              </div>
            </div>
          )}

          <button
            className="checkout-btn"
            onClick={() => {
              const selectedSchemeFromStorage = sessionStorage.getItem("selectedScheme");
              let finalAppliedScheme = appliedScheme;

              if (selectedSchemeFromStorage) {
                try {
                  finalAppliedScheme = JSON.parse(selectedSchemeFromStorage);
                  sessionStorage.removeItem("selectedScheme");
                } catch (e) {}
              }

              navigate("/billing", {
                state: {
                  cart,
                  paymentType: payType,
                  cartTotal,
                  appliedScheme: finalAppliedScheme,
                },
              });

              setCart([]);
              setCheckoutOpen(false);
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>

      <footer className="mdp-footer modern-footer">
        <div className="mdp-footer__inner">
          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Medistock Pro</div>
            <div className="mdp-footer__text">
              Your trusted partner for medicines and healthcare supplies.
            </div>
          </div>

          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Quick Links</div>
            <a className="mdp-footer__link" href="#medicines">
              Medicines
            </a>
            <a className="mdp-footer__link" href="#">
              Orders
            </a>
            <a className="mdp-footer__link" href="#">
              Returns
            </a>
            <a className="mdp-footer__link" href="#contact">
              Contact
            </a>
          </div>

          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Contact</div>
            <div className="mdp-footer__text">Email: support@medistock.com</div>
            <div className="mdp-footer__text">Phone: 025-561152</div>
          </div>
        </div>

        <div className="mdp-footer__bottom">
          © {new Date().getFullYear()} Medistock Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}