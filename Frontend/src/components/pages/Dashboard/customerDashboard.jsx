import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/api.js";
import TopNav from "./TopNav";
import "./customerDashboard.css";

import {
  FaCommentDots,
  FaCreditCard,
  FaMinus,
  FaMoneyBillWave,
  FaPlus,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTimes,
} from "react-icons/fa";

/* ---- DATA ---- */
const schemes = [
  { tag: "10% OFF", tagColor: "green", title: "Flat 10% Off on Pain Relief\nMedicines", cta: "Shop Now →", tone: "mint" },
  { tag: "BOGO", tagColor: "blue", title: "Buy 1 Get 1 on Multivitamins", cta: "Shop Now →", tone: "lavender" },
  { tag: "SALE", tagColor: "orange", title: "Winter Care Sale Up to 20%\nOff", cta: "Shop Now →", tone: "butter" },
  { tag: "SPECIAL OFFER", tagColor: "red", title: "Free Delivery on Orders Over\n$50", cta: "Learn More →", tone: "rose" },
];

// Remove hardcoded topSelling data - will fetch from API
const winterMeds = [
  { id: 101, title: "Cough Syrups", subtitle: "For dry & wet cough", price: 500, imgUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=60" },
  { id: 102, title: "Cold & Flu Tablets", subtitle: "Relief from symptoms", price: 500, imgUrl: "https://images.unsplash.com/photo-1580281658628-6a3b2a0d0b9d?auto=format&fit=crop&w=900&q=60" },
  { id: 103, title: "Vapourubs", subtitle: "Soothing relief", price: 500, imgUrl: "https://images.unsplash.com/photo-1614850523060-8da8aabf6e35?auto=format&fit=crop&w=900&q=60" },
  { id: 104, title: "Throat Lozenges", subtitle: "For sore throats", price: 500, imgUrl: "https://images.unsplash.com/photo-1582719478191-3f91d5a1f6b4?auto=format&fit=crop&w=900&q=60" },
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
      {Array.from({ length: stars.full }).map((_, i) => <FaStar key={`f-${i}`} />)}
      {stars.half ? <FaStarHalfAlt /> : null}
      {Array.from({ length: stars.empty }).map((_, i) => <FaRegStar key={`e-${i}`} />)}
    </div>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payType, setPayType] = useState("cash"); // cash | credit
  const [cart, setCart] = useState([]); // {id,name,price,qty}
  
  // Add state for medicines from API
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch medicines from API
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/inventory/public/medicines/');
        setMedicines(response.data.results || response.data); // Handle both paginated and non-paginated responses
        setLoading(false);
      } catch (err) {
        console.error('Error fetching medicines:', err);
        setError('Failed to load medicines. Please try again later.');
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  // Filter medicines based on search query
  const filteredMedicines = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return medicines;
    return medicines.filter((p) => p.name.toLowerCase().includes(query));
  }, [q, medicines]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, it) => acc + it.qty * it.price, 0), [cart]);

  const addToCart = (p, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x));
      // Use the price from the formatted medicine object, or fallback to API fields
      const price = p.price || p.selling_price || p.mrp || 0;
      return [...prev, { id: p.id, name: p.name, price, qty }];
    });
    setCartOpen(true);
  };

  const inc = (id) => setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
  const dec = (id) =>
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
        .filter((x) => x.qty > 0)
    );

  const removeItem = (id) => setCart((prev) => prev.filter((x) => x.id !== id));
  const openProduct = (p) => setModalProduct(p);

  // Map API medicine data to match expected format
  const formatMedicineForDisplay = (medicine) => ({
    id: medicine.id,
    name: medicine.name,
    price: medicine.selling_price || medicine.mrp || 0,
    rating: 4.5, // Default rating since API doesn't provide it
    reviews: 100, // Default reviews
    imgTone: ["olive", "green", "orange", "blue", "gold", "red", "purple", "teal"][Math.floor(Math.random() * 8)], // Random tone
    desc: medicine.description || "Medicine description not available",
    category: medicine.category_name || medicine.category_type || "General",
    company: medicine.company,
    generic_name: medicine.generic_name,
    stock: medicine.stock,
    status: medicine.status
  });

  return (
    <div className="mdp">
      <TopNav
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="container">
        {/* Loading indicator */}
        {loading && (
          <div className="loading">
            <div className="loading-text">Loading medicines...</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error">
            <div className="error-text">{error}</div>
          </div>
        )}

        {/* Hero Banner */}
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

        {/* Schemes */}
        <section className="section">
          <div className="section-title">Schemes &amp; Discounts</div>
          <div className="scheme-grid">
            {schemes.map((s, idx) => (
              <div key={idx} className={`scheme-card tone-${s.tone}`}>
                <div className={`scheme-tag tag-${s.tagColor}`}>{s.tag}</div>
                <div className="scheme-title">{s.title}</div>
                {/* UPDATED: link to medicines */}
                <a className="scheme-cta" href="#medicines">{s.cta}</a>
              </div>
            ))}
          </div>
        </section>

        {/* Medicines (was Top Selling) */}
        <section className="section" id="medicines">
          <div className="section-title">Medicines</div>
          <div className="product-row">
            {!loading && filteredMedicines.map((medicine) => {
              const formattedMedicine = formatMedicineForDisplay(medicine);
              return (
                <article className="product-card" key={formattedMedicine.id}>
                  <button className="product-click" onClick={() => openProduct(formattedMedicine)} aria-label="Open product">
                    <div
                      className={`product-img tone-img-${formattedMedicine.imgTone}`}
                    />
                  </button>

                  <div className="product-body">
                    <div className="product-name">{formattedMedicine.name}</div>
                    <div className="product-meta">
                      <Rating value={formattedMedicine.rating} />
                      <span className="reviews">({formattedMedicine.reviews.toLocaleString()})</span>
                    </div>
                    <div className="product-price">Rs {formattedMedicine.price}</div>
                    <button className="add-btn" onClick={() => {
                      addToCart(formattedMedicine, 1);
                    }}>Add to Cart</button>
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

        {/* Winter Medicines */}
        <section className="winter">
          <div className="winter-title">Winter Medicines</div>
          <div className="winter-grid">
            {winterMeds.map((w) => (
              <article className="winter-card" key={w.id}>
                <div
                  className="winter-img"
                  style={{ backgroundImage: `url(${w.imgUrl})` }}
                />
                <div className="winter-body">
                  <div className="winter-name">{w.title}</div>
                  <div className="winter-sub">{w.subtitle}</div>
                  <div className="winter-price">Rs {w.price}</div>

                  {/*  Add to Cart */}
                  <button
                    className="winter-add"
                    onClick={() =>
                      addToCart(
                        { id: w.id, name: w.title, price: w.price, mrp: w.price },
                        1
                      )
                    }
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Medicines (Bottom Section) */}
        <section className="section top-selling-bottom">
          <div className="section-title">More Medicines</div>

          <div className="product-row">
            {!loading && filteredMedicines.slice(0, 4).map((medicine) => {
              const formattedMedicine = formatMedicineForDisplay(medicine);
              return (
                <article className="product-card" key={`bottom-${formattedMedicine.id}`}>
                  <button
                    className="product-click"
                    onClick={() => openProduct(formattedMedicine)}
                    aria-label="Open product"
                  >
                    <div
                      className={`product-img tone-img-${formattedMedicine.imgTone}`}
                    />
                  </button>

                  <div className="product-body">
                    <div className="product-name">{formattedMedicine.name}</div>

                    <div className="product-meta">
                      <Rating value={formattedMedicine.rating} />
                      <span className="reviews">({formattedMedicine.reviews.toLocaleString()})</span>
                    </div>

                    <div className="product-price">Rs {formattedMedicine.price}</div>

                    <button className="add-btn" onClick={() => {
                      addToCart(formattedMedicine, 1);
                    }}>
                      Add to Cart
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Floating Chat */}
        <button className="chat-fab" aria-label="Chat">
          <FaCommentDots />
        </button>
      </main>

      {/* CART DRAWER */}
      <div className={`drawer-backdrop ${cartOpen ? "show" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen}>
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

                <div className="cart-item__actions">
                  <button className="qty-btn" onClick={() => dec(it.id)} aria-label="Decrease"><FaMinus /></button>
                  <div className="qty">{it.qty}</div>
                  <button className="qty-btn" onClick={() => inc(it.id)} aria-label="Increase"><FaPlus /></button>
                  <button className="remove" onClick={() => removeItem(it.id)}>Remove</button>
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
            className={`checkout-btn ${cart.length === 0 ? "disabled" : ""}`}
            onClick={() => {
              if (cart.length === 0) return;
              setCheckoutOpen(true);
              setCartOpen(false);
            }}
          >
            Checkout
          </button>
        </div>
      </aside>

      {/* PRODUCT MODAL */}
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
                className={`modal-img tone-img-${modalProduct.imgTone}`}
              />

              <div className="modal-info">
                <div className="modal-name">{modalProduct.name}</div>
                <div className="modal-meta">
                  <Rating value={modalProduct.rating} />
                  <span className="reviews">({modalProduct.reviews.toLocaleString()})</span>
                </div>

                <div className="pill">{modalProduct.category}</div>
                <p className="modal-desc">{modalProduct.desc}</p>

                <div className="modal-price">
                  <span>Price</span>
                  <strong>Rs {modalProduct.price}</strong>
                </div>

                <div className="modal-actions">
                  <button className="add-btn" onClick={() => {
                    addToCart(modalProduct, 1);
                  }}>Add to Cart</button>
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

      {/* CHECKOUT MODAL */}
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
              <div className="bill"><div>Bill Total</div><strong>Rs {cartTotal}</strong></div>
            </div>
          ) : (
            <div className="pay-panel">
              <div className="pay-title">Credit Terms</div>
              <div className="pay-text">
                You have <b>2 months</b> to clear the bill. Late payment may restrict purchase and reduce discounts/bonuses.
              </div>
              <div className="bill"><div>Bill Total</div><strong>Rs {cartTotal}</strong></div>
              <div className="credit-note">
                If not paid in time: restrict purchase to 40–60% of Indian products, deduction in discount and bonuses.
              </div>
            </div>
          )}

          <button
            className="checkout-btn"
            onClick={() => {
              // Navigate to billing page with cart and payment type
              navigate('/billing', { state: { cart, paymentType: payType, cartTotal } });
              setCart([]);
              setCheckoutOpen(false);
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>

      {/* FOOTER (NEW) */}
      <footer className="mdp-footer">
        <div className="mdp-footer__inner">
          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Medistock Pro</div>
            <div className="mdp-footer__text">
              Your trusted partner for medicines and healthcare supplies.
            </div>
          </div>

          <div className="mdp-footer__col">
            <div className="mdp-footer__title">Quick Links</div>
            <a className="mdp-footer__link" href="#medicines">Medicines</a>
            <a className="mdp-footer__link" href="#">Orders</a>
            <a className="mdp-footer__link" href="#">Returns</a>
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