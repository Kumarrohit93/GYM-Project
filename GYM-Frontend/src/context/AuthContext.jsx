import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import API from "../services/api";
import { getRoleFromToken, getUserIdFromToken, normalizeUser } from "../utils/authUtils";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem("gym_token");
    localStorage.removeItem("gym_user");
    localStorage.removeItem("gym_role");
  }, []);

  const persistSession = useCallback((receivedToken, userData, sessionRole) => {
    const tokenRole = getRoleFromToken(receivedToken);
    const resolvedRole = tokenRole || sessionRole;
    const normalizedUser = normalizeUser(userData, receivedToken);

    if (!resolvedRole || !normalizedUser?.id) {
      throw new Error("Invalid session data");
    }

    setToken(receivedToken);
    setUser(normalizedUser);
    setRole(resolvedRole);

    localStorage.setItem("gym_token", receivedToken);
    localStorage.setItem("gym_user", JSON.stringify(normalizedUser));
    localStorage.setItem("gym_role", resolvedRole);
    localStorage.setItem("gym_last_role", resolvedRole);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("gym_token");
    const storedUser = localStorage.getItem("gym_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const tokenRole = getRoleFromToken(storedToken);
        const normalizedUser = normalizeUser(parsedUser, storedToken);

        if (tokenRole && normalizedUser?.id) {
          setToken(storedToken);
          setUser(normalizedUser);
          setRole(tokenRole);
          localStorage.setItem("gym_role", tokenRole);
          localStorage.setItem("gym_user", JSON.stringify(normalizedUser));
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }

    setLoading(false);
  }, [logout]);

  const login = async (usernameOrPhone, password, selectedRole) => {
    try {
      let response;
      if (selectedRole === "admin") {
        response = await API.post("/admin/login", { username: usernameOrPhone, password });
      } else {
        response = await API.post("/member/login", { phone: usernameOrPhone, password });
      }

      const { token: receivedToken, admin, member } = response.data;
      const userData = selectedRole === "admin" ? admin : member;

      persistSession(receivedToken, userData, selectedRole);
      return { success: true, role: getRoleFromToken(receivedToken) || selectedRole };
    } catch (error) {
      const message = error.response?.data?.message || "Invalid credentials. Please try again.";
      return { success: false, error: message };
    }
  };

  const userId = useMemo(() => {
    if (token) {
      return getUserIdFromToken(token);
    }
    return user?.id ? String(user.id) : null;
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ user, token, role, userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
