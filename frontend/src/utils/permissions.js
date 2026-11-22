/** Phản chiếu quy tắc backend, CHỈ để chọn giao diện. Backend mới là nơi quyết định có trả giá sỉ hay không. */
export function canSeeWholesale(user) {
  if (!user) return false;
  if (["super_admin", "manager", "sales"].includes(user.role)) return true;
  return user.wholesale_status === "approved";
}
