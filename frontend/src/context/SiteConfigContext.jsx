import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CONFIG, getSiteConfig } from "../services/siteService";

const SiteConfigContext = createContext(DEFAULT_CONFIG);

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  useEffect(() => { getSiteConfig().then(setConfig).catch(() => {}); }, []);
  const value = useMemo(() => ({ ...config, shippingRule: { flat: Number(config.shipping_flat_fee), freeFrom: Number(config.free_ship_from) } }), [config]);
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteConfigContext);
