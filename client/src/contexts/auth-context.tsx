import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: (shouldRedirect?: boolean) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async (shouldRedirect: boolean = true) => {
    try {
      const response = await apiRequest("GET", "/auth/me", undefined, shouldRedirect);
      const userData = await response.json();
      setUser(userData);
      setError(null);
    } catch (error: any) {
      setUser(null);
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = "/auth/google";
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/auth/logout", undefined, true);
      setUser(null);
      setError(null);
    } catch (error: any) {
      console.error("Logout failed:", error);
      setUser(null);
      setError(error.message || "Logout failed");
    }
  };

  const clearError = () => {
    setError(null);
  };

  const [location] = useLocation();
  
  useEffect(() => {
    // Don't redirect on login page
    const shouldRedirect = location !== "/login";
    checkAuthStatus(shouldRedirect);
  }, [location]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}