/** Lấy thông báo lỗi dễ hiểu từ lỗi Axios / DRF. */
export function apiErrorMessage(err, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  if (!err?.response) return err?.request ? "Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau." : fallback;
  const data = err.response.data;
  if (!data || typeof data === "string") return fallback;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first[0] : String(first);
}

/** Chỉ cho phép chuyển hướng nội bộ để tránh open redirect. */
export function safeNext(next, fallback = "/tai-khoan") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
