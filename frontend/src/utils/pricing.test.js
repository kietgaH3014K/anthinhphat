import { describe, expect, it } from "vitest";
import { calcShipping, calcTotals, unitPrice } from "./pricing";

const item = { retail_price: 100000, wholesale_price: 90000, min_wholesale_qty: 10, qty: 10 };

describe("unitPrice", () => {
  it("khách lẻ luôn dùng giá lẻ", () => expect(unitPrice(item, false)).toBe(100000));
  it("khách sỉ đủ số lượng dùng giá sỉ", () => expect(unitPrice(item, true)).toBe(90000));
  it("khách sỉ chưa đủ số lượng dùng giá lẻ", () => expect(unitPrice({ ...item, qty: 9 }, true)).toBe(100000));
  it("không có giá sỉ thì dùng giá lẻ", () => expect(unitPrice({ ...item, wholesale_price: undefined }, true)).toBe(100000));
});

describe("calcTotals", () => {
  it("tính giảm giá và phí vận chuyển", () => {
    const t = calcTotals([{ ...item, qty: 5 }], false, 10);
    expect(t.subtotal).toBe(500000);
    expect(t.discount).toBe(50000);
    expect(t.shipping).toBe(50000);
    expect(t.total).toBe(500000);
  });
  it("miễn phí vận chuyển từ ngưỡng", () => expect(calcShipping(5_000_000)).toBe(0));
  it("giỏ trống không tính phí", () => expect(calcTotals([], false).total).toBe(0));
});
