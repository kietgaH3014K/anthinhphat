import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import usePageMeta from "../hooks/usePageMeta";
import { listBrands, listCategories, listProducts } from "../services/catalogService";
import { USE_MOCK } from "../services/config";

const SORTS = [
  ["-created", "Mới nhất"], ["price", "Giá tăng dần"], ["-price", "Giá giảm dần"], ["name", "Tên A → Z"],
];
const FLAGS = { featured: "Nổi bật", best_seller: "Bán chạy", new: "Sản phẩm mới", on_sale: "Khuyến mãi" };

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [price, setPrice] = useState({ min: params.get("min_price") || "", max: params.get("max_price") || "" });

  const query = Object.fromEntries(params.entries());
  const categories = useFetch(listCategories, []);
  const brands = useFetch(listBrands, []);
  const products = useFetch(() => listProducts(query, user), [params.toString(), user?.id, user?.wholesale_status]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const applyPrice = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    ["min", "max"].forEach((k) => (price[k] ? next.set(`${k}_price`, price[k]) : next.delete(`${k}_price`)));
    next.delete("page");
    setParams(next);
  };

  const activeCategory = categories.data?.find((c) => c.slug === params.get("category"));
  const title = params.get("search") ? `Kết quả cho “${params.get("search")}”`
    : params.get("flag") ? FLAGS[params.get("flag")] || "Sản phẩm" : activeCategory?.name || "Tất cả sản phẩm";

  usePageMeta({ title, description: `${title} tại AN THỊNH PHÁT: giá cạnh tranh, giao hàng TP.HCM.` });

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      {USE_MOCK && (
        <p className="mb-6 border-l-4 border-gold bg-white p-3 text-sm text-steel-500">
          Đang hiển thị dữ liệu mẫu. Sản phẩm và giá thật sẽ được nhập trong trang quản trị.
        </p>
      )}
      <h1 className="text-h1">{title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div>
          <Button variant="outline" className="w-full lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
            {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
          </Button>
          <form onSubmit={applyPrice} className={`${showFilters ? "mt-4 block" : "hidden"} space-y-8 lg:mt-0 lg:block`} aria-label="Bộ lọc sản phẩm">
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Danh mục</legend>
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                <li><button type="button" className={`w-full py-1 text-left ${!params.get("category") ? "font-bold text-brand-700" : "hover:text-brand-600"}`} onClick={() => setParam("category", "")}>Tất cả</button></li>
                {(categories.data || []).map((c) => (
                  <li key={c.slug}>
                    <button type="button" aria-pressed={params.get("category") === c.slug}
                      className={`w-full py-1 text-left ${params.get("category") === c.slug ? "font-bold text-brand-700" : "hover:text-brand-600"}`}
                      onClick={() => setParam("category", c.slug)}>{c.name}</button>
                  </li>
                ))}
              </ul>
            </fieldset>
            <div>
              <label htmlFor="f-brand" className="mb-2 block text-sm font-bold">Thương hiệu</label>
              <select id="f-brand" className={inputClass} value={params.get("brand") || ""} onChange={(e) => setParam("brand", e.target.value)}>
                <option value="">Tất cả</option>
                {(brands.data || []).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Khoảng giá lẻ (VNĐ)</legend>
              <div className="flex gap-2">
                <input aria-label="Giá từ" type="number" min="0" inputMode="numeric" placeholder="Từ" className={inputClass} value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
                <input aria-label="Giá đến" type="number" min="0" inputMode="numeric" placeholder="Đến" className={inputClass} value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
              </div>
              <Button type="submit" variant="dark" className="mt-3 w-full">Áp dụng</Button>
            </fieldset>
            <Button variant="outline" className="w-full" onClick={() => { setPrice({ min: "", max: "" }); setParams(new URLSearchParams()); }}>Xóa bộ lọc</Button>
          </form>
        </div>

        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-steel-500">{products.data ? `${products.data.count} sản phẩm` : " "}</p>
            <div className="flex items-center gap-2">
              <label htmlFor="f-sort" className="text-sm font-semibold">Sắp xếp</label>
              <select id="f-sort" className={`${inputClass} !w-auto`} value={params.get("ordering") || "-created"} onChange={(e) => setParam("ordering", e.target.value)}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          {products.loading ? <Loading /> : products.error ? <ErrorBox /> : products.data.results.length === 0 ? (
            <Empty title="Không có sản phẩm phù hợp">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.</Empty>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.data.results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={products.data.page} totalPages={products.data.totalPages} onChange={(n) => { setParam("page", String(n)); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
