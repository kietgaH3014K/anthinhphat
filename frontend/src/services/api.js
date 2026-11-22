import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const ACCESS_KEY = "atp_access";
const REFRESH_KEY = "atp_refresh";

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  if (tokenStore.access) config.headers.Authorization = `Bearer ${tokenStore.access}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/token");
    if (error.response?.status === 401 && !original._retried && !isAuthCall && tokenStore.refresh) {
      original._retried = true;
      try {
        refreshing = refreshing || axios.post(`${API_URL}/auth/token/refresh/`, { refresh: tokenStore.refresh });
        const { data } = await refreshing;
        tokenStore.set(data);
        return api(original);
      } catch (refreshError) {
        tokenStore.clear();
        window.dispatchEvent(new Event("atp:logout"));
        return Promise.reject(refreshError);
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
