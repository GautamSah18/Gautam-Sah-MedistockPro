import { useEffect, useMemo, useRef, useState } from "react";
import { FaCamera, FaKey, FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../services/api";
import TopNav from "./TopNav";
import "./profileManagement.css";

export default function ProfileManagement() {
  const { user, updateUserProfile } = useAuth();
  const fileRef = useRef(null);
  
  // Theme: "light" | "dark"
  const [theme, setTheme] = useState(() => localStorage.getItem("mdp_theme") || "light");

  // Profile picture
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Profile info
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    bio: "Tell us a bit about yourself…",
  });

  // Password change
  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  
  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/api/auth/profile/');
        const userData = response.data;
        
        // Update profile state with user data
        setProfile({
          fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'User',
          email: userData.email || user?.email || '',
          phone: userData.phone || "",
          address: userData.address || "",
          bio: userData.bio || "Tell us a bit about yourself…",
        });
        
        // Set avatar preview if profile picture exists
        if (userData.profile_picture) {
          setAvatarPreview(userData.profile_picture);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to user data from auth context if API fails
        if (user) {
          setProfile(prev => ({
            ...prev,
            fullName: user.fullName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
          }));
          
          if (user.profilePicture) {
            setAvatarPreview(user.profilePicture);
          }
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const initials = useMemo(() => {
    const parts = profile.fullName.trim().split(/\s+/);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [profile.fullName]);

  // Apply theme globally
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mdp_theme", theme);
  }, [theme]);

  // Avatar preview cleanup
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic type check
    if (!file.type.startsWith("image/")) return;

    setAvatarFile(file);
  };

  const onRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Add profile info fields
      formData.append('first_name', profile.fullName.split(' ')[0] || '');
      formData.append('last_name', profile.fullName.split(' ').slice(1).join(' ') || '');
      formData.append("phone", profile.phone || "");
      formData.append("address", profile.address || "");
      formData.append("bio", profile.bio || "");
      // Add avatar file if it exists
      if (avatarFile) {
        formData.append('profile_picture', avatarFile);
      }
      
      // Call backend API to save profile
      const response = await api.put('/api/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.profile_picture) {
        updateUserProfile({ profilePicture: response.data.profile_picture });
      }
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    }
  };

const onChangePassword = async (e) => {
  e.preventDefault();

  if (!pwd.current || !pwd.next || !pwd.confirm) {
    alert("Please fill all password fields.");
    return;
  }
  if (pwd.next.length < 6) {
    alert("New password should be at least 6 characters.");
    return;
  }
  if (pwd.next !== pwd.confirm) {
    alert("New password and confirm password do not match.");
    return;
  }

  try {
    await api.post("/api/auth/change-password/", {
      current_password: pwd.current,
      new_password: pwd.next,
    });

    setPwd({ current: "", next: "", confirm: "" });
    alert("Password updated successfully!");
  } catch (error) {
    console.error("Password change error:", error);
    alert(
      error.response?.data?.error?.[0] ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update password"
    );
  }
};


  return (
    <div className="pm-root">
      {/* Keep your existing navbar */}
      <TopNav />

      <main className="pm-wrap">
        <div className="pm-head">
          <div>
            <h2>Profile Settings</h2>
            <p className="pm-sub">Manage your personal info, password, and appearance.</p>
          </div>

          <button
            className="pm-themeBtn"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <>
                <FaMoon /> Dark
              </>
            ) : (
              <>
                <FaSun /> Light
              </>
            )}
          </button>
        </div>

        <div className="pm-grid">
          {/* LEFT: Profile card */}
          <section className="pm-card pm-left">
            <div className="pm-cardTitle">
              <FaUserCircle /> Your Profile
            </div>

            <div className="pm-avatarBlock">
              <div className="pm-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" />
                ) : (
                  <div className="pm-avatarFallback">{initials}</div>
                )}
              </div>

              <div className="pm-avatarActions">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="pm-hiddenFile"
                />

                <button className="pm-btn pm-btnPrimary" onClick={onPickAvatar} type="button">
                  <FaCamera /> Change picture
                </button>

                <button className="pm-btn pm-btnGhost" onClick={onRemoveAvatar} type="button">
                  Remove
                </button>

                <div className="pm-hint">
                </div>
              </div>
            </div>

            <div className="pm-divider" />

            <div className="pm-mini">
              <div className="pm-miniLabel">Account</div>
              <div className="pm-miniValue">{profile.email}</div>
            </div>

            <div className="pm-mini">
              <div className="pm-miniLabel">Theme</div>
              <div className="pm-miniValue">{theme === "light" ? "Light" : "Dark"}</div>
            </div>
          </section>

          {/* RIGHT: Forms */}
          <section className="pm-right">
            {/* Profile info */}
            <form className="pm-card" onSubmit={onSaveProfile}>
              <div className="pm-cardTitle">Profile Information</div>

              <div className="pm-formGrid">
                <div className="pm-field">
                  <label>Full name</label>
                  <input
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>

                <div className="pm-field">
                  <label>Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="name@email.com"
                    type="email"
                  />
                </div>

                <div className="pm-field">
                  <label>Phone</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+977-98XXXXXXXX"
                  />
                </div>

                <div className="pm-field">
                  <label>Address</label>
                  <input
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>

                <div className="pm-field pm-fieldFull">
                  <label>Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Write something..."
                  />
                </div>
              </div>

              <div className="pm-actions">
                <button className="pm-btn pm-btnPrimary" type="submit">
                  Save changes
                </button>
                <button className="pm-btn pm-btnGhost" type="button" onClick={() => alert("Add reset logic if needed.")}>
                  Cancel
                </button>
              </div>
            </form>

            {/* Password */}
            <form className="pm-card" onSubmit={onChangePassword}>
              <div className="pm-cardTitle">
                <FaKey /> Password & Security
              </div>

              <div className="pm-formGrid">
                <div className="pm-field">
                  <label>Current password</label>
                  <input
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd((s) => ({ ...s, current: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="pm-field">
                  <label>New password</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd((s) => ({ ...s, next: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="pm-field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) => setPwd((s) => ({ ...s, confirm: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="pm-note pm-fieldFull">
                  Tip: Use at least 6 characters. Strong passwords are recommended.
                </div>
              </div>

              <div className="pm-actions">
                <button className="pm-btn pm-btnPrimary" type="submit">
                  Update password
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
