import api from "./api";
import { USE_MOCK } from "./config";

export const DEFAULT_CONFIG = {
  company_name: "AN THỊNH PHÁT", hotline: import.meta.env.VITE_HOTLINE || "", zalo_url: import.meta.env.VITE_ZALO || "",
  messenger_url: "", address: "", bank_info: "", shipping_flat_fee: 50000, free_ship_from: 5000000,
};

export async function getSiteConfig() {
  if (USE_MOCK) return DEFAULT_CONFIG;
  const { data } = await api.get("/site-config/");
  return data;
}
