import { describe, expect, it } from "vitest";
import { formatVND } from "./format";

describe("formatVND", () => {
  it("định dạng số tiền có dấu chấm ngăn cách nghìn", () => {
    expect(formatVND(1500000)).toMatch(/1\.500\.000/);
  });
  it("nhận chuỗi số từ API", () => {
    expect(formatVND("92000.00")).toMatch(/92\.000/);
  });
  it("hiển thị Liên hệ khi không có giá", () => {
    expect(formatVND(null)).toBe("Liên hệ");
    expect(formatVND(undefined)).toBe("Liên hệ");
    expect(formatVND("")).toBe("Liên hệ");
  });
});
