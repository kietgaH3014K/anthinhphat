import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import useFetch from "../hooks/useFetch";
import { getProduct } from "../services/catalogService";
import { formatVND } from "../utils/format";

export default function ComparePage() {
  const { slugs, toggle, clear } = useCompare();
  const { add } = useCart();
  const { user } = useAuth();
  const { data, loading, error } = useFetch(
    () => Promise.all(slugs.map((s) => getProduct(s, user).catch(() => null))),
    [slugs.join(","), user?.id, user?.wholesale_status],
  );

  if (slugs.length === 0) {
    return <div className="mx-auto max-w-page px-4 py-16"><h1 className="text-h1">So sánh sản phẩm</h1>
      <div className="mt-8"><Empty title="Chưa chọn sản phẩm để so sánh">Tick “So sánh” trên thẻ sản phẩm (tối đa 3). <Link className="font-bold underline" to="/san-pham">Xem sản phẩm</Link></Empty></div></div>;
  }
  if (loading) return <Loading />;
  if (error) return <div className="mx-auto max-w-page px-4 py-16"><ErrorBox /></div>;

  const products = data.filter(Boolean);
  const rows = [
    ["Giá lẻ", (p) => `${formatVND(p.retail_price)}/${p.unit}`],
    ["Giá sỉ", (p) => (p.wholesale_price != null ? `${formatVND(p.wholesale_price)} (từ ${p.min_wholesale_qty} ${p.unit})` : "Đăng nhập tài khoản sỉ đã duyệt để xem")],
    ["Thương hiệu", (p) => p.brand], ["Xuất xứ", (p) => p.origin], ["Quy cách", (p) => p.spec], ["Đơn vị tính", (p) => p.unit],
    ["Tồn kho", (p) => (p.stock > 0 ? `Còn ${p.stock.toLocaleString("vi-VN")} ${p.unit}` : "Hết hàng")],
  ];

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h1">So sánh sản phẩm</h1>
        <Button variant="outline" onClick={clear}>Xóa danh sách</Button>
      </div>
      <div className="mt-8 overflow-x-auto border border-steel-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-steel-100 text-left">
              <th className="w-36 p-3"><span className="sr-only">Tiêu chí</span></th>
              {products.map((p) => (
                <th key={p.slug} scope="col" className="p-3 align-top">
                  <Link to={`/san-pham/${p.slug}`} className="font-bold hover:text-brand-600">{p.name}</Link>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button className="underline" disabled={p.stock <= 0} onClick={() => add(p, 1)}>Thêm vào giỏ</button>
                    <button className="text-danger underline" onClick={() => toggle(p.slug)}>Bỏ</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, get]) => (
              <tr key={label} className="border-t border-steel-200">
                <th scope="row" className="bg-steel-100 p-3 text-left font-semibold">{label}</th>
                {products.map((p) => <td key={p.slug} className="p-3">{get(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
