import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CompareContext = createContext(null);
const KEY = "atp_compare";
export const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [slugs, setSlugs] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(slugs)); }, [slugs]);

  const value = useMemo(() => ({
    slugs,
    has: (slug) => slugs.includes(slug),
    full: slugs.length >= MAX_COMPARE,
    toggle: (slug) => setSlugs((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= MAX_COMPARE ? cur : [...cur, slug])),
    clear: () => setSlugs([]),
  }), [slugs]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare phải nằm trong <CompareProvider>");
  return ctx;
}
