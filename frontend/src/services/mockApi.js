// DỮ LIỆU MẪU cho Giai đoạn 2. Tên trường (snake_case) giống serializer dự kiến của Django ở Giai đoạn 3.
// Khi API sẵn sàng: đặt VITE_USE_MOCK=false, các service sẽ gọi backend thay vì file này.
// Giá và thương hiệu chỉ để minh họa giao diện, KHÔNG phải bảng giá thật.

export const CATEGORIES = [
  ["xi-mang", "Xi măng"], ["sat-thep", "Sắt thép xây dựng"], ["gach-xay-dung", "Gạch xây dựng"],
  ["cat-xay-dung", "Cát xây dựng"], ["da-xay-dung", "Đá xây dựng"], ["son-nuoc", "Sơn nước"],
  ["chong-tham", "Vật liệu chống thấm"], ["gach-op-lat", "Gạch ốp lát"], ["thiet-bi-ve-sinh", "Thiết bị vệ sinh"],
  ["thiet-bi-dien", "Thiết bị điện"], ["thiet-bi-nuoc", "Thiết bị nước"], ["ton-mai", "Tôn và vật liệu mái"],
  ["thach-cao", "Thạch cao"], ["cua-phu-kien", "Cửa và phụ kiện"], ["cach-nhiet", "Vật liệu cách nhiệt"],
  ["hoan-thien", "Vật liệu hoàn thiện"], ["dung-cu", "Dụng cụ xây dựng"],
].map(([slug, name]) => ({ slug, name }));

// [id, slug, tên, danh mục, thương hiệu, quy cách, đơn vị, giá lẻ, giá sỉ, SL sỉ tối thiểu, tồn kho, cờ, giá gốc]
const RAW = [
  [1, "xi-mang-ha-tien-pcb40", "Xi măng Hà Tiên PCB40", "xi-mang", "Hà Tiên", "Bao 50 kg", "bao", 92000, 86000, 20, 1200, "best", null],
  [2, "xi-mang-insee-da-dung", "Xi măng INSEE đa dụng", "xi-mang", "INSEE", "Bao 50 kg", "bao", 95000, 89000, 20, 800, "best", null],
  [3, "thep-cuon-hoa-phat-d6", "Thép cuộn Hòa Phát Φ6 CB240", "sat-thep", "Hòa Phát", "Cuộn, Φ6 mm", "kg", 17500, 16800, 500, 20000, "best", null],
  [4, "thep-thanh-van-hoa-phat-d10", "Thép thanh vằn Hòa Phát D10 CB300", "sat-thep", "Hòa Phát", "Cây 11,7 m", "cây", 118000, 112000, 100, 1500, "new", null],
  [5, "gach-ong-8x8x18", "Gạch ống 8x8x18 nung tuynel", "gach-xay-dung", "Tuynel", "8 x 8 x 18 cm", "viên", 1350, 1250, 2000, 50000, "sale", 1450],
  [6, "cat-xay-to", "Cát xây tô hạt trung", "cat-xay-dung", "An Thịnh Phát", "Giao theo khối", "m³", 285000, 270000, 10, 300, "", null],
  [7, "da-1x2-xanh", "Đá 1x2 xanh", "da-xay-dung", "An Thịnh Phát", "Giao theo khối", "m³", 350000, 335000, 10, 400, "", null],
  [8, "son-noi-that-dulux-18l", "Sơn nội thất Dulux 18 lít", "son-nuoc", "Dulux", "Thùng 18 L", "thùng", 2650000, 2480000, 5, 60, "new sale", 2790000],
  [9, "son-ngoai-that-jotun-5l", "Sơn ngoại thất Jotun 5 lít", "son-nuoc", "Jotun", "Lon 5 L", "lon", 1250000, 1180000, 5, 80, "", null],
  [10, "chong-tham-sika-latex-th-5l", "Phụ gia chống thấm Sika Latex TH 5 lít", "chong-tham", "Sika", "Can 5 L", "can", 520000, 490000, 10, 120, "sale", 560000],
  [11, "gach-lat-dong-tam-60x60", "Gạch lát nền Đồng Tâm 60x60", "gach-op-lat", "Đồng Tâm", "60 x 60 cm", "m²", 195000, 182000, 50, 900, "new", null],
  [12, "bon-cau-toto-mot-khoi", "Bồn cầu một khối Toto", "thiet-bi-ve-sinh", "Toto", "Bộ 1 khối", "cái", 5900000, 5600000, 3, 15, "best", null],
  [13, "ton-lanh-hoa-sen-045", "Tôn lạnh Hoa Sen 0,45 mm", "ton-mai", "Hoa Sen", "Khổ 1,07 m", "m", 78000, 74000, 100, 5000, "", null],
  [14, "thach-cao-vinh-tuong-9mm", "Tấm thạch cao Vĩnh Tường 9 mm", "thach-cao", "Vĩnh Tường", "1,2 x 2,4 m", "tấm", 95000, 88000, 50, 700, "new", null],
  [15, "ong-pvc-binh-minh-d90", "Ống nhựa PVC Bình Minh Φ90", "thiet-bi-nuoc", "Bình Minh", "Cây 4 m", "cây", 165000, 155000, 20, 0, "", null],
];

export const PRODUCTS = RAW.map(([id, slug, name, category, brand, spec, unit, retail, wholesale, minQty, stock, flags, compareAt]) => ({
  id, slug, name, sku: `ATP-${String(id).padStart(4, "0")}`, category, brand, origin: "Việt Nam", spec, unit,
  retail_price: retail, wholesale_price: wholesale, min_wholesale_qty: minQty, compare_at_price: compareAt, stock,
  status: "active", image: null,
  is_featured: id <= 8, is_best_seller: flags.includes("best"), is_new: flags.includes("new"), on_sale: flags.includes("sale"),
  description: `${name} do AN THỊNH PHÁT cung cấp, giao tại TP. Hồ Chí Minh. Nội dung mô tả chi tiết sẽ được cập nhật trong trang quản trị.`,
  specs: { "Quy cách": spec, "Đơn vị tính": unit, "Xuất xứ": "Việt Nam", "Thương hiệu": brand },
}));

export const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, "vi"));

const COUPONS = { ATP5: 5 }; // mã minh họa

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 120));
const plain = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

/** Mô phỏng việc backend chỉ trả giá sỉ khi người xem đủ quyền. */
function present(product, canWholesale) {
  if (canWholesale) return { ...product };
  const { wholesale_price, min_wholesale_qty, ...publicFields } = product; // eslint-disable-line no-unused-vars
  return publicFields;
}

const FLAG_FIELD = { featured: "is_featured", best_seller: "is_best_seller", new: "is_new", on_sale: "on_sale" };

export async function listProducts(params = {}, canWholesale = false, pageSize = 8) {
  let rows = PRODUCTS.filter((p) => p.status === "active");
  if (params.search) {
    const q = plain(params.search);
    rows = rows.filter((p) => plain(`${p.name} ${p.sku} ${p.brand}`).includes(q));
  }
  if (params.category) rows = rows.filter((p) => p.category === params.category);
  if (params.brand) rows = rows.filter((p) => p.brand === params.brand);
  if (params.min_price) rows = rows.filter((p) => p.retail_price >= Number(params.min_price));
  if (params.max_price) rows = rows.filter((p) => p.retail_price <= Number(params.max_price));
  if (params.flag && FLAG_FIELD[params.flag]) rows = rows.filter((p) => p[FLAG_FIELD[params.flag]]);

  const sorters = {
    price: (a, b) => a.retail_price - b.retail_price,
    "-price": (a, b) => b.retail_price - a.retail_price,
    name: (a, b) => a.name.localeCompare(b.name, "vi"),
    "-created": (a, b) => b.id - a.id,
  };
  rows = [...rows].sort(sorters[params.ordering] || sorters["-created"]);

  const page = Math.max(1, Number(params.page) || 1);
  const results = rows.slice((page - 1) * pageSize, page * pageSize).map((p) => present(p, canWholesale));
  return delay({ count: rows.length, page, totalPages: Math.max(1, Math.ceil(rows.length / pageSize)), results });
}

export async function getProduct(slug, canWholesale = false) {
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) throw Object.assign(new Error("Không tìm thấy sản phẩm"), { status: 404 });
  return delay(present(p, canWholesale));
}

export const listCategories = () => delay(CATEGORIES);
export const listBrands = () => delay(BRANDS);

export async function validateCoupon(code) {
  const percent = COUPONS[String(code).trim().toUpperCase()];
  if (!percent) throw Object.assign(new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn."), { status: 400 });
  return delay({ code: String(code).trim().toUpperCase(), percent });
}

// ---- Đơn hàng và báo giá: lưu localStorage theo từng tài khoản (chỉ để chạy thử giao diện) ----
const read = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const code = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

export async function createOrder(payload, user) {
  const order = { code: code("ATP"), created_at: new Date().toISOString(), status: "pending", payment_status: "unpaid", ...payload };
  const key = `atp_orders:${user.email}`;
  write(key, [order, ...read(key)]);
  return delay(order);
}
export const listOrders = (user) => delay(read(`atp_orders:${user.email}`));
export async function getOrder(orderCode, user) {
  const order = read(`atp_orders:${user.email}`).find((o) => o.code === orderCode);
  if (!order) throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
  return delay(order);
}

export async function createQuote(payload) {
  const quote = { code: code("BG"), created_at: new Date().toISOString(), status: "received", ...payload };
  write("atp_quotes", [quote, ...read("atp_quotes")]);
  return delay(quote);
}
