import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import PriceBlock from "./PriceBlock";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const compare = useCompare();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  useEffect(() => {
    if (!added) return undefined;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <article className="corner-marks flex flex-col border border-steel-200 bg-white">
      <Link to={`/san-pham/${product.slug}`} className="block">
        <ProductImage product={product} className="aspect-[4/3] w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5">
          {product.on_sale && <Badge tone="sale">Khuyến mãi</Badge>}
          {product.is_new && <Badge tone="ok">Mới</Badge>}
          {soldOut && <Badge tone="danger">Hết hàng</Badge>}
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug">
          <Link to={`/san-pham/${product.slug}`} className="hover:text-brand-600">{product.name}</Link>
        </h3>
        <p className="mt-1 text-xs text-steel-500">{product.spec}</p>
        <div className="mt-3 flex-1"><PriceBlock product={product} /></div>
        <Button
          className="mt-4 w-full" disabled={soldOut}
          onClick={() => { add(product, 1); setAdded(true); }}
        >{soldOut ? "Hết hàng" : added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}</Button>
        <label className="mt-3 flex items-center gap-2 text-xs text-steel-500">
          <input
            type="checkbox" checked={compare.has(product.slug)}
            disabled={!compare.has(product.slug) && compare.full}
            onChange={() => compare.toggle(product.slug)}
          />
          So sánh
        </label>
      </div>
    </article>
  );
}
