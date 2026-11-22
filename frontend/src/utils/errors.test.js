import { describe, expect, it } from "vitest";
import { apiErrorMessage, safeNext } from "./errors";

describe("safeNext", () => {
  it("cho phép đường dẫn nội bộ", () => expect(safeNext("/thanh-toan")).toBe("/thanh-toan"));
  it("chặn địa chỉ ngoài", () => {
    expect(safeNext("//evil.com")).toBe("/tai-khoan");
    expect(safeNext("https://evil.com")).toBe("/tai-khoan");
  });
});

describe("apiErrorMessage", () => {
  it("lấy lỗi đầu tiên của trường", () => {
    expect(apiErrorMessage({ response: { data: { email: ["Email này đã được đăng ký."] } } })).toBe("Email này đã được đăng ký.");
  });
  it("báo mất kết nối khi không có phản hồi", () => {
    expect(apiErrorMessage({ request: {} })).toMatch(/kết nối/);
  });
});
