import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout, useGetSettings } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | undefined;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("vault_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      queryKey: ["/api/auth/me"],
      enabled: !!token,
      retry: false,
    },
  });

  const { data: settings } = useGetSettings();

  const sessionTimeoutMinutes = parseInt(
    settings?.find((s) => s.key === "session_timeout_minutes")?.value ?? "0",
    10
  );

  const logoutMutation = useLogout();

  useEffect(() => {
    if (isError) {
      handleLogout();
    }
  }, [isError]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("vault_token", newToken);
    localStorage.setItem("vault_login_time", Date.now().toString());
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("vault_token");
    localStorage.removeItem("vault_login_time");
    setToken(null);
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLocation("/login");
      }
    });
  };

  const handleLogoutRef = useRef(handleLogout);
  handleLogoutRef.current = handleLogout;

  useEffect(() => {
    if (!token || sessionTimeoutMinutes <= 0) return;

    if (!localStorage.getItem("vault_login_time")) {
      localStorage.setItem("vault_login_time", Date.now().toString());
    }

    const check = () => {
      const loginTime = localStorage.getItem("vault_login_time");
      if (!loginTime) return;
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed > sessionTimeoutMinutes * 60 * 1000) {
        handleLogoutRef.current();
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [token, sessionTimeoutMinutes]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading: isUserLoading && !!token, user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
