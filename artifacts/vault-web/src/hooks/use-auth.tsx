import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout, useGetSettings } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

const ACTIVITY_KEY = "vault_last_activity";
const ACTIVITY_THROTTLE_MS = 10_000; // escreve no localStorage no máximo a cada 10s
const CHECK_INTERVAL_MS = 15_000;    // verifica inatividade a cada 15s

// Eventos que indicam atividade do usuário no browser
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown", "mousemove", "keydown", "scroll", "touchstart", "click", "wheel",
];

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
  const [location] = useLocation();
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

  // Ref para evitar closure stale nos handlers de evento
  const handleLogoutRef = useRef<() => void>(() => {});
  const lastThrottleRef = useRef<number>(0);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("vault_token");
    localStorage.removeItem(ACTIVITY_KEY);
    setToken(null);
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLocation("/login");
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  handleLogoutRef.current = handleLogout;

  // Registra atividade: atualiza timestamp com throttle para não sobrecarregar
  const recordActivity = useCallback(() => {
    if (!tokenRef.current) return;
    const now = Date.now();
    if (now - lastThrottleRef.current >= ACTIVITY_THROTTLE_MS) {
      lastThrottleRef.current = now;
      localStorage.setItem(ACTIVITY_KEY, now.toString());
    }
  }, []);

  useEffect(() => {
    if (isError) {
      handleLogoutRef.current();
    }
  }, [isError]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem("vault_token", newToken);
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    lastThrottleRef.current = Date.now();
    setToken(newToken);
  };

  // Registrar atividade a cada mudança de rota (navegação entre páginas)
  useEffect(() => {
    if (!token) return;
    const now = Date.now();
    lastThrottleRef.current = now;
    localStorage.setItem(ACTIVITY_KEY, now.toString());
  }, [location, token]);

  // Adicionar/remover listeners de atividade do usuário
  useEffect(() => {
    if (!token || sessionTimeoutMinutes <= 0) return;

    // Garantir que há um timestamp inicial
    if (!localStorage.getItem(ACTIVITY_KEY)) {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
      lastThrottleRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, recordActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, recordActivity)
      );
    };
  }, [token, sessionTimeoutMinutes, recordActivity]);

  // Verificar inatividade periodicamente
  useEffect(() => {
    if (!token || sessionTimeoutMinutes <= 0) return;

    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

    const check = () => {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      if (!raw) return;
      const elapsed = Date.now() - parseInt(raw, 10);
      if (elapsed > timeoutMs) {
        handleLogoutRef.current();
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, sessionTimeoutMinutes]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: isUserLoading && !!token,
        user,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
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
