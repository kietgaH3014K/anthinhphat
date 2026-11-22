// Mặc định dùng API thật. Đặt VITE_USE_MOCK=true để chạy giao diện bằng dữ liệu mẫu (không cần backend).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
export const PAGE_SIZE = 8;
