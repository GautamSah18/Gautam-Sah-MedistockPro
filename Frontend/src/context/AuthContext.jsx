
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);


  const clearStorage = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userProfilePicture");
  };

  const buildUserFromProfile = (profileData) => {
    const fullName =
      profileData?.first_name || profileData?.last_name
        ? `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim()
        : profileData?.email?.split("@")?.[0] || "User";

    return {
      id: localStorage.getItem("userId") || profileData?.id || null,
      email: profileData?.email || localStorage.getItem("userEmail") || "",
      role: profileData?.role || localStorage.getItem("userRole") || "",
      profilePicture: profileData?.profile_picture || localStorage.getItem("userProfilePicture") || null,
      fullName: fullName || localStorage.getItem("userFullName") || "User",
    };
  };

  const fetchProfile = async () => {
    const res = await api.get("/api/auth/profile/");
    return res.data;
  };

  // ---------- Logout ----------
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        // If you don't have this endpoint, it's okay — it will fail and still clear client state.
        await api.post("/api/auth/logout/", { refresh: refreshToken });
      }
    } catch (err) {
      // ignore
      console.error("Logout error:", err);
    } finally {
      clearStorage();
      setUser(null);
      window.location.href = "/login";
    }
  };

  // ---------- Interceptors (single source of truth for auth headers + refresh) ----------
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If no response (network error), just reject
        if (!error.response) return Promise.reject(error);

        // Only attempt refresh on 401 for requests that haven't been retried
        if (error.response.status === 401 && !originalRequest?._retry) {
          const refreshToken = localStorage.getItem("refresh_token");
          if (!refreshToken) {
            // No refresh token => hard logout
            await logout();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const refreshRes = await api.post("/api/token/refresh/", {
              refresh: refreshToken,
            });

            const newAccess = refreshRes.data?.access;
            if (!newAccess) throw new Error("No access token in refresh response");

            localStorage.setItem("access_token", newAccess);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;

            return api(originalRequest);
          } catch (refreshErr) {
            console.error("Token refresh failed:", refreshErr);
            await logout();
            return Promise.reject(refreshErr);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };

  }, []);


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setBootstrapped(true);
      return;
    }

    const run = async () => {
      try {
        const profileData = await fetchProfile();
        const u = buildUserFromProfile(profileData);

        // Persist what we know (optional but handy)
        if (u.id) localStorage.setItem("userId", u.id);
        if (u.email) localStorage.setItem("userEmail", u.email);
        if (u.role) localStorage.setItem("userRole", u.role);
        if (u.fullName) localStorage.setItem("userFullName", u.fullName);
        if (u.profilePicture) localStorage.setItem("userProfilePicture", u.profilePicture);

        setUser(u);
      } catch (err) {
        console.error("Profile load failed:", err);

        // Fallback: if you stored basic user info at login, you can still set it
        const fallback = {
          id: localStorage.getItem("userId"),
          email: localStorage.getItem("userEmail"),
          role: localStorage.getItem("userRole"),
          profilePicture: localStorage.getItem("userProfilePicture"),
          fullName: localStorage.getItem("userFullName"),
        };

        if (fallback.email && fallback.role) setUser(fallback);
      } finally {
        setBootstrapped(true);
      }
    };

    run();
  }, []);

  // ---------- Login ----------
  const login = async (credentials) => {
    const res = await api.post("/api/auth/login/", credentials);

    if (!res.data?.access || !res.data?.refresh) {
      throw new Error(res.data?.error || "Login failed");
    }

    // Store tokens
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);

    // Store basic user info from login response (if your backend returns it)
    const basic = res.data.user || {};
    if (basic.id) localStorage.setItem("userId", basic.id);
    if (basic.email) localStorage.setItem("userEmail", basic.email);
    if (basic.role) localStorage.setItem("userRole", basic.role);

    // Fetch full profile right after login (interceptor will attach token)
    try {
      const profileData = await fetchProfile();
      const u = buildUserFromProfile(profileData);

      if (u.id) localStorage.setItem("userId", u.id);
      if (u.email) localStorage.setItem("userEmail", u.email);
      if (u.role) localStorage.setItem("userRole", u.role);
      if (u.fullName) localStorage.setItem("userFullName", u.fullName);
      if (u.profilePicture) localStorage.setItem("userProfilePicture", u.profilePicture);

      setUser(u);
    } catch (err) {
      console.error("Error fetching profile after login:", err);

      // fallback to basic login data
      const fallback = {
        id: basic.id || localStorage.getItem("userId"),
        email: basic.email || localStorage.getItem("userEmail"),
        role: basic.role || localStorage.getItem("userRole"),
        profilePicture: localStorage.getItem("userProfilePicture") || null,
        fullName:
          basic.fullName ||
          localStorage.getItem("userFullName") ||
          (basic.email ? basic.email.split("@")[0] : "User"),
      };
      setUser(fallback);
    }

    return res.data;
  };

  // ---------- Update user in context + localStorage ----------
  const updateUserProfile = (profileData) => {
    setUser((prev) => ({ ...(prev || {}), ...profileData }));

    // Keep localStorage keys consistent with your old code
    Object.keys(profileData || {}).forEach((key) => {
      const storageKey = `user${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      localStorage.setItem(storageKey, profileData[key]);
    });
  };

  const value = useMemo(
    () => ({
      user,
      bootstrapped,
      login,
      logout,
      updateUserProfile,
    }),
    [user, bootstrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
