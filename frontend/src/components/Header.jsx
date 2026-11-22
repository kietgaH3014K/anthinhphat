import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useSiteConfig } from "../context/SiteConfigContext";
import Logo from "./Logo";

const NAV = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/bao-gia", label: "Báo giá công trình" },
  { to: "/gioi-thieu", label: "Giới thiệu" },
  { to: "/lien-he", label: "Liên hệ" },
];

const STAFF = ["super_admin", "manager", "sales", "warehouse"];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const { user } = useAuth();
  const { count } = useCart();
  const compare = useCompare();
  const { hotline: HOTLINE } = useSiteConfig();
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/san-pham?search=${encodeURIComponent(q)}` : "/san-pham");
    setOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `block py-2 text-sm font-semibold transition-colors lg:py-0 ${isActive ? "text-brand-600" : "text-steel-900 hover:text-brand-600"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-steel-200 bg-white">
      <div className="mx-auto flex max-w-page items-center gap-4 px-4 py-3">
        <Link to="/" aria-label="AN THỊNH PHÁT – về trang chủ"><Logo /></Link>

        <form onSubmit={submitSearch} role="search" className="ml-auto hidden flex-1 md:ml-8 md:flex md:max-w-md">
          <label htmlFor="site-search" className="sr-only">Tìm sản phẩm</label>
          <input
            id="site-search" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm xi măng, thép, gạch, sơn…"
            className="w-full border border-steel-300 border-r-0 px-4 py-2.5 text-sm placeholder:text-steel-500"
          />
          <button type="submit" className="bg-steel-900 px-5 text-sm font-bold text-white hover:bg-steel-700">Tìm</button>
        </form>

        <div className="ml-auto flex items-center gap-5 md:ml-0">
          {HOTLINE && (
            <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="hidden text-sm font-bold lg:block">
              Hotline <span className="text-brand-600">{HOTLINE}</span>
            </a>
          )}
          {user && STAFF.includes(user.role) && (
            <Link to="/quan-tri" className="hidden text-sm font-bold text-brand-700 hover:text-brand-600 sm:block">Quản trị</Link>
          )}
          <Link to={user ? "/tai-khoan" : "/dang-nhap"} className="text-sm font-semibold hover:text-brand-600">
            {user ? "Tài khoản" : "Đăng nhập"}
          </Link>
          {compare.slugs.length > 0 && (
            <Link to="/so-sanh" className="hidden text-sm font-semibold hover:text-brand-600 sm:block">So sánh ({compare.slugs.length})</Link>
          )}
          <Link to="/gio-hang" className="text-sm font-semibold hover:text-brand-600">
            Giỏ hàng{count > 0 && <span className="ml-1.5 bg-brand-500 px-1.5 py-0.5 text-xs font-bold text-steel-900">{count}</span>}
          </Link>
          <button
            type="button" className="border-2 border-steel-900 px-3 py-1.5 text-sm font-bold lg:hidden"
            aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((v) => !v)}
          >
            {open ? "Đóng" : "Menu"}
          </button>
        </div>
      </div>

      <nav id="main-nav" aria-label="Điều hướng chính" className={`border-t border-steel-200 bg-white lg:block ${open ? "block" : "hidden"}`}>
        <div className="mx-auto max-w-page px-4 lg:flex lg:gap-8 lg:py-3">
          <form onSubmit={submitSearch} role="search" className="mb-2 flex pt-3 md:hidden">
            <label htmlFor="mobile-search" className="sr-only">Tìm sản phẩm</label>
            <input
              id="mobile-search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm…"
              className="w-full border border-steel-300 border-r-0 px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-steel-900 px-4 text-sm font-bold text-white">Tìm</button>
          </form>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
