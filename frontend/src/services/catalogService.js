import api from "./api";
import { PAGE_SIZE, USE_MOCK } from "./config";
import * as mock from "./mockApi";
import { canSeeWholesale } from "../utils/permissions";

/** `user` chỉ dùng cho chế độ mẫu. Khi gọi API thật, backend tự quyết định theo token. */
export async function listProducts(params = {}, user = null) {
  if (USE_MOCK) return mock.listProducts(params, canSeeWholesale(user), PAGE_SIZE);
  const { flag, ...rest } = params;
  const query = { ...rest, ...(flag ? { [flag]: true } : {}) };
  const { data } = await api.get("/products/", { params: query });
  return { count: data.count, page: Number(params.page) || 1, totalPages: Math.max(1, Math.ceil(data.count / PAGE_SIZE)), results: data.results };
}

export async function getProduct(slug, user = null) {
  if (USE_MOCK) return mock.getProduct(slug, canSeeWholesale(user));
  const { data } = await api.get(`/products/${slug}/`);
  return data;
}

export async function listCategories() {
  if (USE_MOCK) return mock.listCategories();
  const { data } = await api.get("/categories/");
  return data.results ?? data;
}

export async function listBrands() {
  if (USE_MOCK) return mock.listBrands();
  const { data } = await api.get("/brands/");
  return (data.results ?? data).map((b) => b.name ?? b);
}

/** Danh sách rút gọn để gợi ý khi nhập báo giá. */
export async function listProductOptions() {
  if (USE_MOCK) return mock.PRODUCTS.map(({ slug, name, unit }) => ({ slug, name, unit }));
  const { data } = await api.get("/products/", { params: { page_size: 200 } });
  return (data.results ?? data).map(({ slug, name, unit }) => ({ slug, name, unit }));
}
