const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/** Định dạng giá VNĐ. Giá rỗng (ví dụ khách chưa được xem giá sỉ) hiển thị "Liên hệ". */
export function formatVND(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "Liên hệ";
  return vnd.format(Number(value));
}
