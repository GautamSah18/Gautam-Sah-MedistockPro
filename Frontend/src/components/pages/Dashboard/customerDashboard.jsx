import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CartSchemePopup from "../../../components/CartSchemePopup";
import api from "../../../services/api.js";
import "./customerDashboard.css";
import TopNav from "./TopNav";

import {
  FaCreditCard,
  FaMinus,
  FaMoneyBillWave,
  FaPlus,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTimes,
} from "react-icons/fa";

const schemes = [
  { tag: "10% OFF", tagColor: "green", title: "Flat 10% Off on Pain Relief\nMedicines", cta: "Shop Now →", tone: "mint" },
  { tag: "BOGO", tagColor: "blue", title: "Buy 1 Get 1 on Multivitamins", cta: "Shop Now →", tone: "lavender" },
  { tag: "SALE", tagColor: "orange", title: "Winter Care Sale Up to 20%\nOff", cta: "Shop Now →", tone: "butter" },
  { tag: "SPECIAL OFFER", tagColor: "red", title: "Free Delivery on Orders Over\n$50", cta: "Learn More →", tone: "rose" },
];

function Rating({ value = 4 }) {
  const stars = useMemo(() => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return { full, half, empty };
  }, [value]);

  return (
    <div className="rating">
      {Array.from({ length: stars.full }).map((_, i) => (
        <FaStar key={`f-${i}`} />
      ))}
      {stars.half ? <FaStarHalfAlt /> : null}
      {Array.from({ length: stars.empty }).map((_, i) => (
        <FaRegStar key={`e-${i}`} />
      ))}
    </div>
  );
}

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
    if (query) result = result.filter((p) => (p.name || "").toLowerCase().includes(query));
    return result;
  }, [q, medicines]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, it) => acc + it.qty * it.price, 0), [cart]);

  const formatMedicineForDisplay = (medicine) => ({
    id: medicine.id,
    name: medicine.name,
    price: Number(medicine.selling_price || medicine.mrp || 0),
    rating: 4.5,
    reviews: 100,
    desc: medicine.description || "Medicine description not available",
    category: medicine.category_name || medicine.category_type || "General",
    company: medicine.company,
    generic_name: medicine.generic_name,
    stock: medicine.stock,
    status: medicine.status,
    image: medicine.image || medicine.image_url || null,
  });

  const fetchEligibleSchemes = async (total) => {
    const res = await api.get("/api/bonus-schemes/bill-schemes/");
    const all = Array.isArray(res.data) ? res.data : res.data.results || [];
    const now = new Date();

    return all.filter((s) => {
      // Check if scheme is unlocked based on customer's purchase history
      const unlocked = s.unlocked === undefined ? true : Boolean(s.unlocked);
      const activeOk = s.is_active === undefined ? true : Boolean(s.is_active);
      const startOk = s.start_date ? new Date(s.start_date) <= now : true;
      const endOk = s.end_date ? new Date(s.end_date) >= now : true;
      return unlocked && activeOk && startOk && endOk;
    });
  };

  return (
    <div className="mdp">
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
          navigate("/bonus-schemes", { state: { cart, cartTotal, selectedScheme: scheme } });
        }}
      />

      <main className="container">
        <div className="mdp-layout">
          <div className="mdp-content">
            {loading && (
              <div className="loading">
                <div className="loading-text">Loading medicines...</div>
              </div>
            )}

            {error && (
              <div className="error">
                <div className="error-text">{error}</div>
              </div>
            )}

            <section className="hero">
              <div className="hero-overlay" />
              <div className="hero-content">
                <h1>Seasonal Health Offers</h1>
                <p>
                  Stay healthy this season with our special discounts <br />
                  on essential medicines and supplements.
                </p>
                <button className="primary-btn" onClick={() => window.scrollTo({ top: 520, behavior: "smooth" })}>
                  Explore Offers
                </button>
              </div>
            </section>

            <section className="section">
              <div className="section-title">Schemes &amp; Discounts</div>
              <div className="scheme-grid">
                {schemes.map((s, idx) => (
                  <div key={idx} className={`scheme-card tone-${s.tone}`}>
                    <div className={`scheme-tag tag-${s.tagColor}`}>{s.tag}</div>
                    <div className="scheme-title">{s.title}</div>
                    <a className="scheme-cta" href="#medicines">
                      {s.cta}
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="medicines">
              <div className="section-header">
                <div className="section-title">Medicines</div>
                <button className="view-all-btn" onClick={() => navigate("/products")}>
                  View All
                </button>
              </div>
              <div className="product-row">
                {!loading &&
                  filteredMedicines.map((medicine) => {
                    const fm = formatMedicineForDisplay(medicine);
                    return (
                      <article className="product-card" key={fm.id}>
                        <button className="product-click" onClick={() => openProduct(fm)} aria-label="Open product">
                          <div
                            className="product-img"
                            style={
                              fm.image
                                ? { backgroundImage: `url(${fm.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : { backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }
                            }
                          >
                            {!fm.image && <span style={{ color: "#9ca3af", fontSize: "24px" }}>💊</span>}
                          </div>
                        </button>

                        <div className="product-body">
                          <div className="product-name">{fm.name}</div>
                          <div className="product-meta">
                            <div className="company">{fm.company}</div>
                          </div>
                          <div className="product-price">Rs {fm.price}</div>
                          <button className="add-btn" onClick={() => addToCart(fm, 1)}>
                            Add to Cart
                          </button>
                        </div>
                      </article>
                    );
                  })}

                {!loading && filteredMedicines.length === 0 && (
                  <div className="no-results">
                    <p>No medicines found matching your search.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="winter">
              <div className="winter-title">Winter Medicines</div>
              <div className="winter-grid">
                {!loading &&
                  filteredMedicines.slice(0, 4).map((medicine) => {
                    const fm = formatMedicineForDisplay(medicine);
                    return (
                      <article className="winter-card" key={`winter-${fm.id}`}>
                        <div
                          className="winter-img"
                          style={
                            fm.image
                              ? { backgroundImage: `url(${fm.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : { backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }
                          }
                        >
                          {!fm.image && <span style={{ color: "#9ca3af", fontSize: "24px" }}>💊</span>}
                        </div>
                        <div className="winter-body">
                          <div className="winter-name">{fm.name}</div>
                          <div className="winter-sub">
                            {fm.desc.substring(0, 50)}
                            {fm.desc.length > 50 ? "..." : ""}
                          </div>
                          <div className="winter-price">Rs {fm.price}</div>
                          <button className="winter-add" onClick={() => addToCart({ id: fm.id, name: fm.name, price: fm.price, mrp: fm.price }, 1)}>
                            Add to Cart
                          </button>
                        </div>
                      </article>
                    );
                  })}

                {!loading && filteredMedicines.length === 0 && (
                  <div className="no-results">
                    <p>No medicines available.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="section top-selling-bottom">
              <div className="section-title">More Medicines</div>
              <div className="product-row">
                {!loading &&
                  filteredMedicines.slice(0, 4).map((medicine) => {
                    const fm = formatMedicineForDisplay(medicine);
                    return (
                      <article className="product-card" key={`bottom-${fm.id}`}>
                        <button className="product-click" onClick={() => openProduct(fm)} aria-label="Open product">
                          <div
                            className="product-img"
                            style={
                              fm.image
                                ? { backgroundImage: `url(${fm.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                                : { backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }
                            }
                          >
                            {!fm.image && <span style={{ color: "#9ca3af", fontSize: "24px" }}>💊</span>}
                          </div>
                        </button>

                        <div className="product-body">
                          <div className="product-name">{fm.name}</div>
                          <div className="product-meta">
                            <div className="company">{fm.company}</div>
                          </div>
                          <div className="product-price">Rs {fm.price}</div>
                          <button className="add-btn" onClick={() => addToCart(fm, 1)}>
                            Add to Cart
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className={`drawer-backdrop ${cartOpen ? "show" : ""}`} onClick={() => setCartOpen(false)} />
      <aside ref={cartRef} className={`drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
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
                  {Number(it.bonus_free_qty || 0) > 0 && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Bonus: {it.qty} + {it.bonus_free_qty} free
                    </div>
                  )}
                </div>

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

      <div className={`modal-backdrop ${modalProduct ? "show" : ""}`} onClick={() => setModalProduct(null)} />
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
                    ? { backgroundImage: `url(${modalProduct.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }
                }
              >
                {!modalProduct.image && <span style={{ color: "#9ca3af", fontSize: "48px" }}>💊</span>}
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

      <div className={`modal-backdrop ${checkoutOpen ? "show" : ""}`} onClick={() => setCheckoutOpen(false)} />
      <div className={`checkout ${checkoutOpen ? "open" : ""}`} role="dialog" aria-hidden={!checkoutOpen}>
        <div className="modal-head">
          <div className="modal-title">Checkout</div>
          <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="checkout-body">
          <div className="pay-toggle">
            <button className={`pay-opt ${payType === "cash" ? "active" : ""}`} onClick={() => setPayType("cash")}>
              <FaMoneyBillWave /> Cash
            </button>
            <button className={`pay-opt ${payType === "credit" ? "active" : ""}`} onClick={() => setPayType("credit")}>
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
                You have <b>2 months</b> to clear the bill. Late payment may restrict purchase and reduce discounts/bonuses.
              </div>
              <div className="bill">
                <div>Bill Total</div>
                <strong>Rs {cartTotal}</strong>
              </div>
              <div className="credit-note">If not paid in time: restrict in bonuses and discount.</div>
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

              navigate("/billing", { state: { cart, paymentType: payType, cartTotal, appliedScheme: finalAppliedScheme } });
              setCart([]);
              setCheckoutOpen(false);
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>

      <footer className="mdp-footer">
        <div className="mdp-footer__inner">
          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Medistock Pro</div>
            <div className="mdp-footer__text">Your trusted partner for medicines and healthcare supplies.</div>
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
          </div>

          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Contact</div>
            <div className="mdp-footer__text">Email: support@medistock.com</div>
            <div className="mdp-footer__text">Phone: 025-561152</div>
          </div>
        </div>

        <div className="mdp-footer__bottom">© {new Date().getFullYear()} Medistock Pro. All rights reserved.</div>
      </footer>
    </div>
  );
}
