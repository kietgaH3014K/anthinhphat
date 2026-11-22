import { describe, expect, it } from "vitest";
import { canSeeWholesale } from "./permissions";

describe("canSeeWholesale", () => {
  it("khách chưa đăng nhập: không", () => expect(canSeeWholesale(null)).toBe(false));
  it("khách lẻ: không", () => expect(canSeeWholesale({ role: "customer", wholesale_status: "none" })).toBe(false));
  it("khách sỉ chờ duyệt: không", () => expect(canSeeWholesale({ role: "customer", wholesale_status: "pending" })).toBe(false));
  it("khách sỉ đã duyệt: có", () => expect(canSeeWholesale({ role: "customer", wholesale_status: "approved" })).toBe(true));
  it("nhân viên bán hàng: có", () => expect(canSeeWholesale({ role: "sales" })).toBe(true));
  it("nhân viên kho: không", () => expect(canSeeWholesale({ role: "warehouse" })).toBe(false));
});
