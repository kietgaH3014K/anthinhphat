/** Logic giỏ hàng thuần (không phụ thuộc React) để dễ kiểm thử. */
export const initialCart = { items: [] };

const clamp = (qty, stock) => Math.max(1, Math.min(Number(qty) || 1, stock));

export function cartReducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { items: Array.isArray(action.items) ? action.items : [] };
    case "add": {
      const p = action.product;
      if (!p || p.stock <= 0) return state;
      const found = state.items.find((it) => it.id === p.id);
      if (found) {
        return { items: state.items.map((it) => (it.id === p.id ? { ...it, qty: clamp(it.qty + action.qty, it.stock) } : it)) };
      }
      const item = {
        id: p.id, slug: p.slug, name: p.name, unit: p.unit, spec: p.spec, stock: p.stock,
        retail_price: p.retail_price, wholesale_price: p.wholesale_price, min_wholesale_qty: p.min_wholesale_qty,
        qty: clamp(action.qty, p.stock), selected: true,
      };
      return { items: [...state.items, item] };
    }
    case "setQty":
      return { items: state.items.map((it) => (it.id === action.id ? { ...it, qty: clamp(action.qty, it.stock) } : it)) };
    case "toggle":
      return { items: state.items.map((it) => (it.id === action.id ? { ...it, selected: !it.selected } : it)) };
    case "toggleAll":
      return { items: state.items.map((it) => ({ ...it, selected: action.selected })) };
    case "remove":
      return { items: state.items.filter((it) => it.id !== action.id) };
    case "removeSelected":
      return { items: state.items.filter((it) => !it.selected) };
    default:
      return state;
  }
}
