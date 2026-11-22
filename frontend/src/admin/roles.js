export const ALL_STAFF = ["super_admin", "manager", "sales", "warehouse"];
export const SALES_UP = ["super_admin", "manager", "sales"];
export const MANAGER_UP = ["super_admin", "manager"];
export const WAREHOUSE_UP = ["super_admin", "manager", "warehouse"];
export const SUPER_ONLY = ["super_admin"];

// Chỉ để ẩn/hiện giao diện. Quyền thật được kiểm tra ở backend cho từng API.
export const can = (user, roles) => Boolean(user && roles.includes(user.role));
