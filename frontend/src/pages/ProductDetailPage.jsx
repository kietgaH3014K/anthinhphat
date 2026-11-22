import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PriceBlock from "../components/PriceBlock";
import ProductImage from "../components/ProductImage";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import QtyInput from "../components/ui/QtyInput";
import { ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import useFetch from "../hooks/useFetch";
import usePageMeta from "../hooks/usePageMeta";
import { getProduct } from "../services/catalogService";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const compare = useCompare();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { data: p, loading, error } = useFetch(() => getProduct(slug, user), [slug, user?.id, user?.wholesale_status]);

  usePageMeta(p ? {
    title: p.meta_title || p.name,
    description: p.meta_description || `${p.name} (${p.spec}) giá tốt tại AN THỊNH PHÁT, giao hàng TP.HCM.`,
    jsonLd: {
      "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      image: p.image || undefined, description: p.description,
      offers: { "@type": "Offer", priceCurrency: "VND", price: p.retail_price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    },
  } : {});

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="mx-auto max-w-page px-4 py-16">
        <ErrorBox message={error.status === 404 || error.response?.status === 404 ? "Không tìm thấy sản phẩm này." : undefined} />
        <Button to="/san-pham" className="mt-6">Về danh sách sản phẩm</Button>
      </div>
    );
  }
  const soldOut = p.stock <= 0;

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <nav aria-label="Đường dẫn" className="mb-6 text-sm text-steel-500">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link> / <Link to="/san-pham" className="hover:text-brand-600">Sản phẩm</Link> / <span className="text-steel-900">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductImage product={p} className="aspect-square w-full border border-steel-200" />
        <div>
          <div className="flex flex-wrap gap-2">
            {p.on_sale && <Badge tone="sale">Khuyến mãi</Badge>}
            {p.is_new && <Badge tone="ok">Mới</Badge>}
            <Badge tone={soldOut ? "danger" : "neutral"}>{soldOut ? "Hết hàng" : `Còn ${p.stock.toLocaleString("vi-VN")} ${p.unit}`}</Badge>
          </div>
          <h1 className="mt-3 text-h1">{p.name}</h1>
          <p className="mt-2 text-sm text-steel-500">Mã SKU: {p.sku} · Thương hiệu: {p.brand}</p>

          <div className="mt-6 border-y border-steel-200 py-6"><PriceBlock product={p} large /></div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QtyInput value={qty} onChange={setQty} max={p.stock || 1} />
            <Button disabled={soldOut} onClick={() => { add(p, qty); setAdded(true); setTimeout(() => setAdded(false), 1800); }}>
              {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
            </Button>
            <Button to={`/bao-gia?sp=${p.slug}`} variant="outline">Yêu cầu báo giá</Button>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-steel-500">
            <input type="checkbox" checked={compare.has(p.slug)} disabled={!compare.has(p.slug) && compare.full} onChange={() => compare.toggle(p.slug)} />
            Thêm vào danh sách so sánh
          </label>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="pd-desc">
          <h2 id="pd-desc" className="text-h3">Mô tả</h2>
          <p className="mt-3 max-w-prose leading-relaxed text-steel-700">{p.description}</p>
        </section>
        <section aria-labelledby="pd-spec">
          <h2 id="pd-spec" className="text-h3">Thông số</h2>
          <table className="mt-3 w-full border border-steel-200 bg-white text-sm">
            <tbody>
              {Object.entries(p.specs || {}).map(([k, v]) => (
                <tr key={k} className="border-b border-steel-200 last:border-0">
                  <th scope="row" className="w-2/5 bg-steel-100 px-4 py-2.5 text-left font-semibold">{k}</th>
                  <td className="px-4 py-2.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
