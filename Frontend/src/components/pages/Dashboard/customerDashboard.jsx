import { useMemo, useState } from "react";
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

const topSelling = [
  { id: 1, name: "Paracetamol 500mg", price: 500, reviews: 1204, rating: 4.5, imgTone: "olive", desc: "Fast relief for fever and pain. Trusted for daily use.", category: "Pain Relief" },
  { id: 2, name: "Amoxicillin 250mg", price: 500, reviews: 987, rating: 4, imgTone: "green", desc: "Antibiotic commonly used for bacterial infections.", category: "Antibiotics" },
  {
    id: 3, name: "Vitamin C Tablets", price: 500, reviews: 2310, rating: 4.5, imgTone: "orange",
    imgUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=60",
    desc: "Supports immunity and recovery. Great for daily wellness.", category: "Supplements",
  },
  {
    id: 4, name: "ORS Pack", price: 500, reviews: 854, rating: 4, imgTone: "blue",
    imgUrl: "https://images.unsplash.com/photo-1615486363973-3f7d5a4b1e9d?auto=format&fit=crop&w=900&q=60",
    desc: "Hydration salts for quick electrolyte balance.", category: "Hydration",
  },
  { id: 5, name: "Azithromycin 500mg", price: 500, reviews: 1050, rating: 4, imgTone: "gold", desc: "Antibiotic for various bacterial infections (as prescribed).", category: "Antibiotics" },
];

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
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payType, setPayType] = useState("cash"); // cash | credit
  const [cart, setCart] = useState([]); // {id,name,price,qty}

  const filteredTopSelling = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return topSelling;
    return topSelling.filter((p) => p.name.toLowerCase().includes(query));
  }, [q]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, it) => acc + it.qty * it.price, 0), [cart]);

  const addToCart = (p, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x));
      return [...prev, { id: p.id, name: p.name, price: p.price, qty }];
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
                <a className="scheme-cta" href="#top-selling">{s.cta}</a>
              </div>
            ))}
          </div>
        </section>

        {/* Top Selling */}
        <section className="section" id="top-selling">
          <div className="section-title">Top Selling Products</div>
          <div className="product-row">
            {filteredTopSelling.map((p) => (
              <article className="product-card" key={p.id}>
                <button className="product-click" onClick={() => openProduct(p)} aria-label="Open product">
                  <div
                    className={`product-img tone-img-${p.imgTone}`}
                    style={p.imgUrl ? { backgroundImage: `url(${p.imgUrl})` } : undefined}
                  />
                </button>

                <div className="product-body">
                  <div className="product-name">{p.name}</div>
                  <div className="product-meta">
                    <Rating value={p.rating} />
                    <span className="reviews">({p.reviews.toLocaleString()})</span>
                  </div>
                  <div className="product-price">Rs {p.price}</div>
                  <button className="add-btn" onClick={() => addToCart(p, 1)}>Add to Cart</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Winter Medicines */}
        <section className="winter">
          <div className="winter-title">Winter Medicines</div>
          <div className="winter-grid">
            {winterMeds.map((w) => (
              <article className="winter-card" key={w.id}>
                <div className="winter-img" style={{ backgroundImage: `url(${w.imgUrl})` }} />
                <div className="winter-body">
                  <div className="winter-name">{w.title}</div>
                  <div className="winter-sub">{w.subtitle}</div>
                  <div className="winter-price">Rs {w.price}</div>
                </div>
              </article>
            ))}
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
                style={modalProduct.imgUrl ? { backgroundImage: `url(${modalProduct.imgUrl})` } : undefined}
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
                  <button className="add-btn" onClick={() => addToCart(modalProduct, 1)}>Add to Cart</button>
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
              setCart([]);
              setCheckoutOpen(false);
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}
