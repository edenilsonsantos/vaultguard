import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
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

  const logoutMutation = useLogout();

  useEffect(() => {
    if (isError) {
      handleLogout();
    }
  }, [isError]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("vault_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("vault_token");
    setToken(null);
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLocation("/login");
      }
    });
  };

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
