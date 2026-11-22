import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 bg-steel-900 text-steel-300">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            AN THỊNH PHÁT – Chất lượng tạo niềm tin, đồng hành cùng mọi công trình.
          </p>
        </div>
        <nav aria-label="Mua hàng">
          <h2 className="text-sm font-bold text-white">Mua hàng</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-brand-500" to="/san-pham">Tất cả sản phẩm</Link></li>
            <li><Link className="hover:text-brand-500" to="/bao-gia">Yêu cầu báo giá công trình</Link></li>
            <li><Link className="hover:text-brand-500" to="/gio-hang">Giỏ hàng</Link></li>
          </ul>
        </nav>
        <nav aria-label="Công ty">
          <h2 className="text-sm font-bold text-white">Công ty</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-brand-500" to="/gioi-thieu">Giới thiệu</Link></li>
            <li><Link className="hover:text-brand-500" to="/lien-he">Liên hệ</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-steel-700 py-5 text-center text-xs">
        © {new Date().getFullYear()} AN THỊNH PHÁT. Khu vực phục vụ: TP. Hồ Chí Minh.
      </div>
    </footer>
  );
}
