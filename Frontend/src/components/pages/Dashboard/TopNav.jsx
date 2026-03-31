import { useEffect, useRef, useState } from "react";
import {
  FaBell,
  FaSearch,
  FaShoppingCart,
  FaUser
} from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./customerDashboard.css";

export default function TopNav({
  searchValue = "",
  onSearchChange = () => {},
  showSearch = true,
  cartCount = 0,
  onCartClick = () => {},
  onAddToCart = () => {},
}) {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  /* REAL-TIME NOTIFICATIONS */
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (n) => {
    if (n.notification_type === "complaint") {
      navigate("/customer/complaints");
    } else if (n.notification_type === "expiry") {
      navigate("/customer/returns");
    } else if (n.notification_type === "medicine") {
      navigate("/products");
    } else if (n.notification_type === "bonus" || n.notification_type === "scheme") {
      navigate("/bonus-schemes");
    }
    setOpen(false);
  };

  const getNotifTitle = (type) => {
    switch (type) {
      case "medicine":
        return "New Medicine";
      case "bonus":
        return "New Bonus";
      case "scheme":
        return "New Scheme";
      case "expiry":
        return "Expiry Request";
      case "complaint":
        return "Complaint Issue";
      default:
        return "Notification";
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/api/notifications/");
      const data = response.data.results || response.data;

      const mappedNotifications = data.map((n) => ({
        id: n.id,
        icon: <FaBell />,
        title: getNotifTitle(n.notification_type),
        text: n.message,
        isRead: n.is_read,
        notification_type: n.notification_type,
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (notifications.length === 0) return;

      await api.post("/api/notifications/mark-read/");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const markSingleAsRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/mark-read/`);

      setNotifications((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        setUnreadCount(updated.length);
        return updated;
      });
    } catch (err) {
      console.error("Error marking single notification as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);

    socket.onopen = () => {
      console.log("Notification socket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      const newNotif = {
        id: data.id, // IMPORTANT: backend websocket should send real notification id
        icon: <FaBell />,
        title: getNotifTitle(data.notification_type),
        text: data.message,
        isRead: false,
        notification_type: data.notification_type,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("Notification socket closed");
    };

    return () => socket.close();
  }, []);

  const toggleNotifications = () => {
    setOpen((prev) => !prev);
  };

  const [imgError, setImgError] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mdp_theme") || "light");
  const timeoutRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mdp_theme", theme);
  }, [theme]);

  const setDropdownTimeout = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 300);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    authLogout();
  };

  const handleSearchChange = async (value) => {
    onSearchChange(value);

    if (value.trim() === "") {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await api.get(
        `/api/inventory/public/medicines/?search=${encodeURIComponent(value)}`
      );
      const medicines = response.data.results || response.data;
      setSearchResults(medicines.slice(0, 5));
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const formatMedicineForDisplay = (medicine) => ({
    id: medicine.id,
    name: medicine.name,
    price: medicine.selling_price || medicine.mrp || 0,
    company: medicine.company,
    category: medicine.category_name || medicine.category_type || "General",
    stock: medicine.stock,
  });

  const handleAddToCart = (medicine) => {
    const formattedMedicine = formatMedicineForDisplay(medicine);
    onAddToCart(formattedMedicine, 1);
    setSearchResults([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest(".search-container");
      if (!searchContainer && showSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  return (
    <header className="mdp-nav">
      <div className="mdp-nav__left">
        <Link to="/customerDashboard" className="Medi">
          <span className="brand-text">Medistock Pro</span>
        </Link>
      </div>

      <nav className="mdp-nav__center">
        <NavLink to="/customerDashboard" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/customer/returns" className="nav-link">
          Expiry Return
        </NavLink>
        <NavLink to="/customer/complaints" className="nav-link">
          Complaint issues
        </NavLink>
        <NavLink to="/products" className="nav-link">
          Products
        </NavLink>
        <NavLink to="/bonus-schemes" className="nav-link">
          Bonus & Schemes
        </NavLink>
        <NavLink to="/orders" className="nav-link">
          Orders
        </NavLink>
        <NavLink to="/loyalty" className="nav-link">
          Loyalty
        </NavLink>
        <NavLink
          to="/TrackOrders"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Track Order
        </NavLink>
      </nav>

      <div className="mdp-nav__right">
        {showSearch && (
          <div className="search-container">
            <div className="search">
              <FaSearch className="search-ic" />
              <input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() =>
                  searchValue &&
                  searchResults.length > 0 &&
                  setShowSuggestions(true)
                }
                placeholder="Search for medicines..."
              />
            </div>

            {showSuggestions && searchResults.length > 0 && (
              <div className="search-suggestions">
                {searchResults.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="suggestion-item"
                    onClick={() => handleAddToCart(medicine)}
                  >
                    <div className="suggestion-name">{medicine.name}</div>
                    <div className="suggestion-details">
                      <span>{medicine.company}</span>
                      <span>Rs {formatMedicineForDisplay(medicine).price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="notif-wrap">
          <button
            className="icon-btn notif-btn"
            onClick={toggleNotifications}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          <div className={`notif-dd ${open ? "open" : ""}`}>
            <div className="notif-head">
              <div className="notif-title">Notifications</div>
              {notifications.length > 0 && (
                <button
                  className="mark-all-btn"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-item">
                  <div>No notifications</div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    className="notif-item"
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="notif-ic">{n.icon}</div>
                    <div className="notif-content">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-text">{n.text}</div>
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markSingleAsRead(n.id);
                        }}
                      >
                        Mark as Read
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {open && (
            <div
              className="notif-backdrop"
              onClick={() => setOpen(false)}
            />
          )}
        </div>

        <button
          className="icon-btn cart-btn"
          onClick={onCartClick}
        >
          <FaShoppingCart />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </button>

        <div className="profile-dropdown-container">
          <Link
            className="icon-btn"
            to="/profile"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownTimeout()}
          >
            {user?.profilePicture && !imgError ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                onError={() => setImgError(true)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <FaUser />
            )}
          </Link>

          {dropdownOpen && (
            <div
              className="profile-dropdown"
              onMouseEnter={() => clearTimeout(timeoutRef.current)}
              onMouseLeave={() => setDropdownTimeout()}
            >
              <Link className="dropdown-item" to="/profile">
                Profile
              </Link>
              <div
                className="dropdown-item"
                onClick={toggleTheme}
              >
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </div>
              <div
                className="dropdown-item"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}