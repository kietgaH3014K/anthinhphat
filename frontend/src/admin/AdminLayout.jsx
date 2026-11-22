import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { ALL_STAFF, MANAGER_UP, SALES_UP, SUPER_ONLY, can } from "./roles";

export const NAV = [
  ["/quan-tri/tong-quan", "Tổng quan", MANAGER_UP],
  ["/quan-tri/don-hang", "Đơn hàng", ALL_STAFF],
  ["/quan-tri/bao-gia", "Báo giá", ALL_STAFF],
  ["/quan-tri/san-pham", "Sản phẩm", ALL_STAFF],
  ["/quan-tri/danh-muc", "Danh mục", ALL_STAFF],
  ["/quan-tri/thuong-hieu", "Thương hiệu", ALL_STAFF],
  ["/quan-tri/ton-kho", "Kho và tồn kho", ALL_STAFF],
  ["/quan-tri/kho", "Danh sách kho", ALL_STAFF],
  ["/quan-tri/nha-cung-cap", "Nhà cung cấp", ALL_STAFF],
  ["/quan-tri/khach-hang", "Khách hàng và khách sỉ", SALES_UP],
  ["/quan-tri/nhom-khach", "Nhóm khách (chiết khấu)", SALES_UP],
  ["/quan-tri/khuyen-mai", "Khuyến mãi", SALES_UP],
  ["/quan-tri/nhan-vien", "Nhân viên và phân quyền", SUPER_ONLY],
  ["/quan-tri/cau-hinh", "Cấu hình website", MANAGER_UP],
];

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/dang-nhap?next=/quan-tri" replace />;
  if (!can(user, ALL_STAFF)) return <Navigate to="/" replace />;

  const entry = NAV.find(([to]) => pathname === to);
  if (entry && !can(user, entry[2])) return <Navigate to="/quan-tri" replace />;

  const links = NAV.filter(([, , roles]) => can(user, roles));
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-steel-900 text-steel-200 lg:min-h-screen">
        <div className="p-5"><Logo inverted /></div>
        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap px-3 py-2 text-sm font-semibold ${isActive ? "bg-brand-500 text-steel-900" : "hover:bg-steel-700"}`}>{label}</NavLink>
          ))}
          <NavLink to="/" className="whitespace-nowrap px-3 py-2 text-sm text-steel-300 hover:bg-steel-700 lg:mt-6">← Về website</NavLink>
        </nav>
      </aside>
      <main className="min-w-0 p-5 lg:p-8"><Outlet /></main>
    </div>
  );
}

export function AdminHome() {
  const { user } = useAuth();
  const first = NAV.find(([, , roles]) => can(user, roles));
  return <Navigate to={first ? first[0] : "/"} replace />;
}
