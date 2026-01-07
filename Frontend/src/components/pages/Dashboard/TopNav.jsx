import { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaClock,
  FaSearch,
  FaShoppingCart,
  FaTag,
  FaTruck,
  FaUndo,
  FaUser,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./customerDashboard.css";

const demoNotifications = [
  { id: 1, icon: <FaTruck />, title: "Order #1023", text: "Dispatched — arriving soon." },
  { id: 2, icon: <FaClock />, title: "Credit Due", text: "Your credit bill is due in 10 days." },
  { id: 3, icon: <FaUndo />, title: "Expiry Return", text: "Return request approved for 2 items." },
  { id: 4, icon: <FaTag />, title: "New Scheme", text: "Flat 10% off on Pain Relief medicines." },
];

export default function TopNav({
  searchValue = "",
  onSearchChange = () => {},
  showSearch = true,
  cartCount = 0,
  onCartClick = () => {},
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ✅ Theme state (persists)
  const [theme, setTheme] = useState(() => localStorage.getItem("mdp_theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mdp_theme", theme);
  }, [theme]);

  const badgeCount = useMemo(() => (seen ? 0 : demoNotifications.length), [seen]);

  return (
    <header className="mdp-nav">
      <div className="mdp-nav__left">
        <Link to="/customerDashboard" className="brand-pill">
          <span className="brand-icon">✚</span>
          <span className="brand-text">Medistock Pro</span>
        </Link>
      </div>

      <nav className="mdp-nav__center">
        <NavLink
          to="/customerDashboard"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Home
        </NavLink>

        <NavLink
          to="/customer/categories"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Categories
        </NavLink>

        <NavLink
          to="/customer/prescriptions"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Prescriptions
        </NavLink>

        <NavLink
          to="/customer/orders"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Orders
        </NavLink>

        <NavLink
          to="/customer/returns"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          Expiry Return
        </NavLink>
      </nav>

      <div className="mdp-nav__right">
        {showSearch ? (
          <div className="search">
            <FaSearch className="search-ic" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for medicines..."
            />
          </div>
        ) : (
          <div className="nav-spacer" />
        )}

        {/* Notifications */}
        <div className="notif-wrap">
          <button
            className="icon-btn notif-btn"
            aria-label="Notifications"
            onClick={() => {
              setOpen((v) => !v);
              setSeen(true);
            }}
          >
            <FaBell />
            {badgeCount > 0 ? <span className="notif-badge">{badgeCount}</span> : null}
          </button>

          <div className={`notif-dd ${open ? "open" : ""}`}>
            <div className="notif-head">
              <div className="notif-title">Notifications</div>
              <button className="notif-clear" onClick={() => setSeen(true)}>
                Mark all read
              </button>
            </div>

            <div className="notif-list">
              {demoNotifications.map((n) => (
                <div className="notif-item" key={n.id}>
                  <div className="notif-ic">{n.icon}</div>
                  <div>
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-text">{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {open ? <div className="notif-backdrop" onClick={() => setOpen(false)} /> : null}
        </div>

        {/* Cart */}
        <button className="icon-btn cart-btn" aria-label="Cart" onClick={onCartClick}>
          <FaShoppingCart />
          {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
        </button>

        {/* ✅ Theme toggle */}
        <button
          className="icon-btn"
          aria-label="Toggle theme"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </button>

        {/* Profile */}
        <Link className="icon-btn" aria-label="Profile" to="/profile">
          {user?.profilePicture && !imgError ? (
            <img 
              src={user.profilePicture} 
              alt="Profile" 
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <FaUser />
          )}
        </Link>
      </div>
    </header>
  );
}
