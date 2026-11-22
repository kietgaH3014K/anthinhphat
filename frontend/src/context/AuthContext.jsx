import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.access));

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get("/accounts/me/");
      setUser(data);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStore.access) loadMe();
    const onLogout = () => setUser(null);
    window.addEventListener("atp:logout", onLogout);
    return () => window.removeEventListener("atp:logout", onLogout);
  }, [loadMe]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/token/", { email, password });
      tokenStore.set(data);
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStore.refresh) await api.post("/auth/logout/", { refresh: tokenStore.refresh });
    } catch {
      /* token có thể đã hết hạn – vẫn đăng xuất phía client */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}
