import { describe, expect, it } from "vitest";
import { NAV } from "./AdminLayout.jsx";
import { ALL_STAFF, MANAGER_UP, can } from "./roles";

describe("can", () => {
  it("khách hàng không có quyền quản trị", () => expect(can({ role: "customer" }, ALL_STAFF)).toBe(false));
  it("chưa đăng nhập: không", () => expect(can(null, ALL_STAFF)).toBe(false));
  it("nhân viên kho không vào được tổng quan doanh thu", () => expect(can({ role: "warehouse" }, MANAGER_UP)).toBe(false));
  it("quản lý có quyền quản lý", () => expect(can({ role: "manager" }, MANAGER_UP)).toBe(true));
});

describe("menu quản trị", () => {
  it("chỉ Super Admin thấy mục nhân viên", () => {
    const entry = NAV.find(([to]) => to.endsWith("nhan-vien"));
    expect(can({ role: "manager" }, entry[2])).toBe(false);
    expect(can({ role: "super_admin" }, entry[2])).toBe(true);
  });
});
