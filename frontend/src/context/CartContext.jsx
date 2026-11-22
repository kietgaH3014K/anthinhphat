import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { cartReducer, initialCart } from "../utils/cart";

const CartContext = createContext(null);
const KEY = "atp_cart";
const COUPON_KEY = "atp_coupon";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCart, () => ({ items: load() }));

  const [coupon, setCoupon] = useState(() => { try { return JSON.parse(localStorage.getItem(COUPON_KEY)); } catch { return null; } });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state.items)); }, [state.items]);
  useEffect(() => { localStorage.setItem(COUPON_KEY, JSON.stringify(coupon)); }, [coupon]);

  const value = useMemo(() => ({
    items: state.items,
    count: state.items.length,
    coupon,
    setCoupon,
    selectedItems: state.items.filter((i) => i.selected),
    add: (product, qty = 1) => dispatch({ type: "add", product, qty }),
    setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
    toggle: (id) => dispatch({ type: "toggle", id }),
    toggleAll: (selected) => dispatch({ type: "toggleAll", selected }),
    remove: (id) => dispatch({ type: "remove", id }),
    removeSelected: () => dispatch({ type: "removeSelected" }),
  }), [state.items, coupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải nằm trong <CartProvider>");
  return ctx;
}
