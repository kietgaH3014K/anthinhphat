import { formatVND } from "../utils/format";
import { ALL_STAFF, MANAGER_UP, SUPER_ONLY, WAREHOUSE_UP } from "./roles";

const yesNo = (v) => (v ? "Có" : "Không");
const dateOnly = (v) => (v ? String(v).slice(0, 10) : "");

export const RESOURCES = {
  "san-pham": {
    endpoint: "products", title: "Sản phẩm", writeRoles: MANAGER_UP,
    columns: [
      { key: "sku", label: "SKU" }, { key: "name", label: "Tên sản phẩm" },
      { key: "retail_price", label: "Giá lẻ", render: (r) => formatVND(r.retail_price) },
      { key: "stock", label: "Tồn kho", render: (r) => `${r.stock} ${r.unit}` },
      { key: "status", label: "Trạng thái", render: (r) => (r.status === "active" ? "Đang bán" : "Ngừng bán") },
    ],
    newDefaults: { status: "active", min_wholesale_qty: 1, low_stock_threshold: 10 },
    toForm: (p) => ({ ...p, specs_text: Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join("\n"), image_upload: undefined }),
    fields: [
      { name: "sku", label: "SKU", required: true }, { name: "name", label: "Tên sản phẩm", required: true },
      { name: "category", label: "Danh mục", type: "select", optionsFrom: "categories", required: true },
      { name: "brand", label: "Thương hiệu", type: "select", optionsFrom: "brands" },
      { name: "unit", label: "Đơn vị tính", required: true, hint: "bao, kg, m³, viên…" }, { name: "spec", label: "Quy cách" },
      { name: "origin", label: "Xuất xứ" },
      { name: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "active", label: "Đang kinh doanh" }, { value: "hidden", label: "Ngừng kinh doanh" }] },
      { name: "retail_price", label: "Giá bán lẻ (VNĐ)", type: "number", required: true },
      { name: "wholesale_price", label: "Giá bán sỉ (VNĐ)", type: "number", hint: "Để trống nếu không bán sỉ." },
      { name: "min_wholesale_qty", label: "Số lượng tối thiểu mua sỉ", type: "number" },
      { name: "compare_at_price", label: "Giá gốc để gạch ngang (khuyến mãi)", type: "number" },
      { name: "low_stock_threshold", label: "Ngưỡng cảnh báo sắp hết", type: "number" },
      { name: "is_featured", label: "Sản phẩm nổi bật", type: "checkbox" }, { name: "is_best_seller", label: "Bán chạy", type: "checkbox" },
      { name: "is_new", label: "Sản phẩm mới", type: "checkbox" }, { name: "on_sale", label: "Khuyến mãi", type: "checkbox" },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "specs_text", label: "Thông số kỹ thuật", type: "textarea", hint: "Mỗi dòng một thông số, dạng “Tên: giá trị”." },
      { name: "image_upload", label: "Ảnh sản phẩm (JPG, PNG, WebP, tối đa 5 MB)", type: "file" },
      { name: "meta_title", label: "SEO: tiêu đề" }, { name: "meta_description", label: "SEO: mô tả" },
    ],
  },
  "danh-muc": {
    endpoint: "categories", title: "Danh mục", writeRoles: MANAGER_UP,
    columns: [{ key: "name", label: "Tên" }, { key: "slug", label: "Đường dẫn" }, { key: "is_active", label: "Hiển thị", render: (r) => yesNo(r.is_active) }],
    newDefaults: { is_active: true, sort_order: 0 },
    fields: [
      { name: "name", label: "Tên danh mục", required: true },
      { name: "parent", label: "Danh mục cha (để tạo danh mục con)", type: "select", optionsFrom: "categories" },
      { name: "sort_order", label: "Thứ tự", type: "number" }, { name: "is_active", label: "Hiển thị trên website", type: "checkbox" },
    ],
  },
  "thuong-hieu": {
    endpoint: "brands", title: "Thương hiệu", writeRoles: MANAGER_UP,
    columns: [{ key: "name", label: "Tên" }, { key: "is_active", label: "Hiển thị", render: (r) => yesNo(r.is_active) }],
    newDefaults: { is_active: true },
    fields: [{ name: "name", label: "Tên thương hiệu", required: true }, { name: "is_active", label: "Hiển thị", type: "checkbox" }],
  },
  "kho": {
    endpoint: "warehouses", title: "Danh sách kho", writeRoles: MANAGER_UP,
    columns: [{ key: "name", label: "Tên kho" }, { key: "address", label: "Địa chỉ" }, { key: "is_active", label: "Hoạt động", render: (r) => yesNo(r.is_active) }],
    newDefaults: { is_active: true },
    fields: [{ name: "name", label: "Tên kho", required: true }, { name: "address", label: "Địa chỉ" }, { name: "is_active", label: "Đang hoạt động", type: "checkbox" }],
  },
  "nha-cung-cap": {
    endpoint: "suppliers", title: "Nhà cung cấp", writeRoles: WAREHOUSE_UP,
    columns: [{ key: "name", label: "Tên" }, { key: "contact_name", label: "Liên hệ" }, { key: "phone", label: "Điện thoại" }, { key: "tax_code", label: "Mã số thuế" }],
    newDefaults: { is_active: true },
    fields: [
      { name: "name", label: "Tên nhà cung cấp", required: true }, { name: "contact_name", label: "Người liên hệ" }, { name: "phone", label: "Điện thoại" },
      { name: "email", label: "Email", type: "email" }, { name: "address", label: "Địa chỉ", wide: true }, { name: "tax_code", label: "Mã số thuế" },
      { name: "is_active", label: "Đang hợp tác", type: "checkbox" },
    ],
  },
  "nhom-khach": {
    endpoint: "customer-groups", title: "Nhóm khách (chiết khấu)", writeRoles: MANAGER_UP,
    columns: [{ key: "name", label: "Tên nhóm" }, { key: "discount_percent", label: "Chiết khấu giá sỉ", render: (r) => `${r.discount_percent}%` }, { key: "description", label: "Mô tả" }],
    newDefaults: { discount_percent: 0 },
    fields: [
      { name: "name", label: "Tên nhóm", required: true }, { name: "discount_percent", label: "Chiết khấu trên giá sỉ (%)", type: "number", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
    ],
  },
  "khuyen-mai": {
    endpoint: "promotions", title: "Khuyến mãi (mã giảm giá)", writeRoles: MANAGER_UP,
    columns: [
      { key: "code", label: "Mã" }, { key: "percent", label: "Giảm", render: (r) => `${r.percent}%` },
      { key: "min_order", label: "Đơn tối thiểu", render: (r) => formatVND(r.min_order) },
      { key: "used_count", label: "Đã dùng", render: (r) => `${r.used_count}${r.max_uses ? ` / ${r.max_uses}` : ""}` },
      { key: "is_active", label: "Bật", render: (r) => yesNo(r.is_active) },
    ],
    newDefaults: { is_active: true, min_order: 0 },
    toForm: (p) => ({ ...p, starts_at: dateOnly(p.starts_at), ends_at: dateOnly(p.ends_at) }),
    toPayload: (d) => ({ ...d, starts_at: d.starts_at ? `${d.starts_at}T00:00:00` : null, ends_at: d.ends_at ? `${d.ends_at}T23:59:59` : null }),
    fields: [
      { name: "code", label: "Mã giảm giá", required: true }, { name: "percent", label: "Giảm (%)", type: "number", required: true },
      { name: "min_order", label: "Giá trị đơn tối thiểu (VNĐ)", type: "number" }, { name: "max_uses", label: "Số lượt dùng tối đa", type: "number", hint: "Để trống = không giới hạn." },
      { name: "starts_at", label: "Bắt đầu", type: "date" }, { name: "ends_at", label: "Kết thúc", type: "date" },
      { name: "description", label: "Mô tả", wide: true }, { name: "is_active", label: "Đang bật", type: "checkbox" },
    ],
  },
  "nhan-vien": {
    endpoint: "staff", title: "Nhân viên và phân quyền", writeRoles: SUPER_ONLY, canDelete: false,
    columns: [
      { key: "email", label: "Email" }, { key: "full_name", label: "Họ tên" },
      { key: "role", label: "Vai trò", render: (r) => ({ super_admin: "Super Admin", manager: "Quản lý", sales: "Nhân viên bán hàng", warehouse: "Nhân viên kho" }[r.role] || r.role) },
      { key: "is_active", label: "Đang hoạt động", render: (r) => yesNo(r.is_active) },
    ],
    newDefaults: { is_active: true, role: "sales" },
    fields: [
      { name: "email", label: "Email đăng nhập", type: "email", required: true }, { name: "full_name", label: "Họ và tên", required: true }, { name: "phone", label: "Điện thoại" },
      { name: "role", label: "Vai trò", type: "select", required: true, options: [{ value: "manager", label: "Quản lý" }, { value: "sales", label: "Nhân viên bán hàng" }, { value: "warehouse", label: "Nhân viên kho" }, { value: "super_admin", label: "Super Admin" }] },
      { name: "password", label: "Mật khẩu", type: "password", required: true, hint: "Khi sửa: để trống nếu không đổi." },
      { name: "is_active", label: "Cho phép đăng nhập", type: "checkbox" },
    ],
  },
};

export const READ_ONLY_FOR = ALL_STAFF;
