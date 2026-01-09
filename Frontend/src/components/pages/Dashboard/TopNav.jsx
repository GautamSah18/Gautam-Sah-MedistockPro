import { useEffect, useMemo, useState, useRef } from "react";
import {
  FaBell,
  FaClock,
  FaSearch,
  FaShoppingCart,
  FaTag,
  FaTruck,
  FaUndo,
  FaUser,
} from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
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
  onAddToCart = () => {}, // Function to add item to cart
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("mdp_theme") || "light");
  const timeoutRef = useRef(null);
  
  // Reset imgError when user object changes
  useEffect(() => {
    setImgError(false);
  }, [user]);
    
  // Update theme in localStorage and document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mdp_theme", theme);
  }, [theme]);
    
  // Function to handle dropdown timeout
  const setDropdownTimeout = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 300); // 300ms delay before closing
  };
    
  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };
    
  // Function to handle logout
  const { logout: authLogout } = useAuth();
  const handleLogout = () => {
    // Close dropdown before logout
    setDropdownOpen(false);
      
    // Call logout from auth context
    authLogout();
  };
    
  // Handle search input changes
  const handleSearchChange = async (value) => {
    onSearchChange(value);
    
    if (value.trim() === '') {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      // Fetch search results from API
      const response = await api.get(`/api/inventory/public/medicines/?search=${encodeURIComponent(value)}`);
      const medicines = response.data.results || response.data;
      setSearchResults(medicines.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };
  
  // Format medicine for display
  const formatMedicineForDisplay = (medicine) => ({
    id: medicine.id,
    name: medicine.name,
    price: medicine.selling_price || medicine.mrp || 0,
    company: medicine.company,
    category: medicine.category_name || medicine.category_type || "General",
    stock: medicine.stock,
  });
  
  // Handle adding item to cart from search results
  const handleAddToCart = (medicine) => {
    const formattedMedicine = formatMedicineForDisplay(medicine);
    onAddToCart(formattedMedicine, 1);
    setSearchResults([]);
    setShowSuggestions(false);
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest('.search-container');
      if (!searchContainer && showSuggestions) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const badgeCount = useMemo(() => (seen ? 0 : demoNotifications.length), [seen]);

  return (
    <header className="mdp-nav">
      <div className="mdp-nav__left">
        <Link to="/customerDashboard" className="Medi">
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
          <div className="search-container">
            <div className="search">
              <FaSearch className="search-ic" />
              <input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchValue && searchResults.length > 0 && setShowSuggestions(true)}
                placeholder="Search for medicines..."
              />
            </div>
            
            {/* Search Suggestions Dropdown */}
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
                      <span className="suggestion-company">{medicine.company}</span>
                      <span className="suggestion-price">Rs {formatMedicineForDisplay(medicine).price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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



        {/* Profile with dropdown */}
        <div className="profile-dropdown-container">
          <Link 
            className="icon-btn"
            aria-label="Profile"
            to="/profile"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownTimeout()}
          >
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
          
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div 
              className="profile-dropdown"
              onMouseEnter={() => {
                clearTimeout(timeoutRef.current);
                setDropdownOpen(true);
              }}
              onMouseLeave={() => setDropdownTimeout()}
            >
              <Link 
                className="dropdown-item" 
                to="/profile"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <div className="dropdown-item" onClick={toggleTheme}>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
