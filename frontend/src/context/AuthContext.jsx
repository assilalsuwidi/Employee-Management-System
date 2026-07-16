// AuthContext.jsx -- نسخة مُحدَّثة تعتمد على JWT بدل تخزين كائن
// المستخدم كاملاً في localStorage كما في النسخة القديمة.
import { createContext, useContext, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(authService.getRole());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setRole(data.role);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    authService.logout();
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
