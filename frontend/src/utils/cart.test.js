import { describe, expect, it } from "vitest";
import { cartReducer, initialCart } from "./cart";

const product = { id: 1, slug: "a", name: "A", unit: "bao", stock: 5, retail_price: 100 };

describe("cartReducer", () => {
  it("gộp cùng sản phẩm và không vượt tồn kho", () => {
    let s = cartReducer(initialCart, { type: "add", product, qty: 3 });
    s = cartReducer(s, { type: "add", product, qty: 4 });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].qty).toBe(5);
  });
  it("không thêm sản phẩm hết hàng", () => {
    expect(cartReducer(initialCart, { type: "add", product: { ...product, stock: 0 }, qty: 1 }).items).toHaveLength(0);
  });
  it("số lượng tối thiểu là 1", () => {
    let s = cartReducer(initialCart, { type: "add", product, qty: 2 });
    s = cartReducer(s, { type: "setQty", id: 1, qty: 0 });
    expect(s.items[0].qty).toBe(1);
  });
  it("xóa các mục đã chọn", () => {
    let s = cartReducer(initialCart, { type: "add", product, qty: 1 });
    s = cartReducer(s, { type: "add", product: { ...product, id: 2 }, qty: 1 });
    s = cartReducer(s, { type: "toggle", id: 2 });
    s = cartReducer(s, { type: "removeSelected" });
    expect(s.items.map((i) => i.id)).toEqual([2]);
  });
});
