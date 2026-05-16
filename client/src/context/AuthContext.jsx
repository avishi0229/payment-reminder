import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.get("/auth/me");
      setUser(data.user);
      setOrg(data.org);
      setIsAuthenticated(true);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (data) => {
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setOrg(data.org);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setOrg(null);
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
