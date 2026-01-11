import { useEffect, Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api.js";
import TopNav from "./TopNav";

import {
  FaMinus,
  FaPlus,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTimes,
} from "react-icons/fa";


export default function ProductPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payType, setPayType] = useState("cash");
  const [cart, setCart] = useState([]);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [companyFilter, setCompanyFilter] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expiryDateFilter, setExpiryDateFilter] = useState("");

  // Extract unique values for filter options
  const uniqueCompanies = [...new Set(medicines.map(m => m.company).filter(Boolean))];
  const uniqueCategoryTypes = [...new Set(medicines.map(m => m.category_type).filter(Boolean))];
  const uniqueCategories = [...new Set(medicines.map(m => m.category_name).filter(Boolean))];

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/inventory/public/medicines/");
        setMedicines(response.data.results || response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching medicines:", err);
        setError("Failed to load medicines. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const filteredMedicines = useMemo(() => {
    let result = medicines;

    const query = q.trim().toLowerCase();
    if (query) result = result.filter((p) => (p.name || "").toLowerCase().includes(query));
    
    // Apply company filter
    if (companyFilter) {
      result = result.filter(m => m.company && m.company.toLowerCase().includes(companyFilter.toLowerCase()));
    }
    
    // Apply category type filter
    if (categoryTypeFilter) {
      result = result.filter(m => m.category_type && m.category_type.toLowerCase().includes(categoryTypeFilter.toLowerCase()));
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(m => m.category_name && m.category_name.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    
    // Apply expiry date filter
    if (expiryDateFilter) {
      result = result.filter(m => m.expiry_date && new Date(m.expiry_date) >= new Date(expiryDateFilter));
    }

    return result;
  }, [q, medicines, companyFilter, categoryTypeFilter, categoryFilter, expiryDateFilter]);

  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, it) => acc + it.qty * it.price, 0), [cart]);

  const addToCart = (p, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x));
      const price = p.price || p.selling_price || p.mrp || 0;
      return [...prev, { id: p.id, name: p.name, price: Number(price) || 0, qty }];
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

  // Internal CSS styles for filters
  const styles = `
    .mdp-layout {
      display: flex;
      gap: 20px;
    }
    
    .filters {
      width: 250px;
      padding: 20px;
      background: var(--card);
      border-radius: 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--line);
      height: fit-content;
    }
    
    .filters h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 900;
      color: var(--text);
    }
    
    .filter-group {
      margin-bottom: 15px;
    }
    
    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }
    
    .filter-group select,
    .filter-group input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--input-bg);
      color: var(--text);
      font-size: 13px;
    }
    
    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: var(--green);
    }
    
    .clear-filters-btn {
      width: 100%;
      background: #f3f4f6;
      color: var(--text);
      border: 1px solid var(--line);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .clear-filters-btn:hover {
      background: #e5e7eb;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 1024px) {
      .product-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .filters {
        width: 100%;
        margin-bottom: 20px;
      }
      
      .mdp-layout {
        flex-direction: column;
      }
      
      .product-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 480px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <Fragment>
      <style>{styles}</style>
      <div className="mdp">
      <TopNav
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onAddToCart={addToCart}
      />

      <main className="container">
        <div className="mdp-layout">
          <div className="filters">
            <h3>Filters</h3>
            <div className="filter-group">
              <label htmlFor="company-filter">Company Name</label>
              <select id="company-filter" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="category-type-filter">Category Type</label>
              <select id="category-type-filter" value={categoryTypeFilter} onChange={(e) => setCategoryTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {uniqueCategoryTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="category-filter">Categories</label>
              <select id="category-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="expiry-date-filter">Expiry Date</label>
              <input 
                type="date" 
                id="expiry-date-filter" 
                value={expiryDateFilter} 
                onChange={(e) => setExpiryDateFilter(e.target.value)}
              />
            </div>
            
            <button 
              className="clear-filters-btn" 
              onClick={() => {
                setCompanyFilter("");
                setCategoryTypeFilter("");
                setCategoryFilter("");
                setExpiryDateFilter("");
              }}
            >
              Clear Filters
            </button>
          </div>
          
          <div className="mdp-content">
            <section className="section">
              <div className="section-title">All Products</div>
              
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

              {!loading && filteredMedicines.length === 0 && (
                <div className="no-results">
                  <p>No medicines found matching your search.</p>
                </div>
              )}

              <div className="product-grid">
                {!loading &&
                  filteredMedicines.map((medicine) => {
                    const fm = formatMedicineForDisplay(medicine);
                    return (
                      <article className="product-card" key={fm.id}>
                        <button className="product-click" onClick={() => openProduct(fm)} aria-label="Open product">
                          <div className="product-img" style={fm.image ? { backgroundImage: `url(${fm.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {!fm.image && <span style={{ color: '#9ca3af', fontSize: '24px' }}>💊</span>}
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
              <div className="modal-img" style={modalProduct.image ? { backgroundImage: `url(${modalProduct.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                {!modalProduct.image && <span style={{ color: '#9ca3af', fontSize: '48px' }}>💊</span>}</div>

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
              Cash
            </button>
            <button className={`pay-opt ${payType === "credit" ? "active" : ""}`} onClick={() => setPayType("credit")}>
              Credit (2 months)
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
              <div className="credit-note">
                If not paid in time: restrict purchase to 40–60% of Indian products, deduction in discount and bonuses.
              </div>
            </div>
          )}

          <button
            className="checkout-btn"
            onClick={() => {
              navigate("/billing", { state: { cart, paymentType: payType, cartTotal } });
              setCart([]);
              setCheckoutOpen(false);
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
    </Fragment>
  );
}