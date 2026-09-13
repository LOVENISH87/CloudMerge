import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/auth";
import { setAccessToken, setOnAuthLost } from "../api/client";

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

function consumeGoogleLoginRedirect(): { accessToken: string; refreshToken: string } | null {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("loginAccessToken");
  const refreshToken = params.get("loginRefreshToken");
  if (!accessToken || !refreshToken) return null;
  window.history.replaceState({}, "", window.location.pathname);
  return { accessToken, refreshToken };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  useEffect(() => {
    setOnAuthLost(clearSession);

    const fromGoogleRedirect = consumeGoogleLoginRedirect();
    if (fromGoogleRedirect) {
      setAccessToken(fromGoogleRedirect.accessToken);
      localStorage.setItem("refreshToken", fromGoogleRedirect.refreshToken);
      authApi
        .me()
        .then((u) => setUser(u))
        .catch(() => clearSession())
        .finally(() => setLoading(false));
      return;
    }

    // no refresh token stored -> not logged in, skip the /me probe
    if (!localStorage.getItem("refreshToken")) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const applySession = (result: { accessToken: string; refreshToken: string }, email: string, id: string) => {
    setAccessToken(result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);
    setUser({ id, email });
  };

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    applySession(result, email, result.userId);
  };

  const register = async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    applySession(result, email, result.userId);
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    clearSession();
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
