import { Route, Routes } from "react-router-dom";
import AdminLayout, { AdminHome } from "./admin/AdminLayout";
import CustomersAdminPage from "./admin/CustomersAdminPage";
import DashboardPage from "./admin/DashboardPage";
import InventoryAdminPage from "./admin/InventoryAdminPage";
import OrdersAdminPage from "./admin/OrdersAdminPage";
import QuotationsAdminPage from "./admin/QuotationsAdminPage";
import ResourcePage from "./admin/ResourcePage";
import SettingsPage from "./admin/SettingsPage";
import { RESOURCES } from "./admin/resources";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layouts/MainLayout";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ComparePage from "./pages/ComparePage";
import ContactPage from "./pages/ContactPage";
import DesignSystemPage from "./pages/DesignSystemPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import QuotePage from "./pages/QuotePage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="quan-tri" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="tong-quan" element={<DashboardPage />} />
        <Route path="don-hang" element={<OrdersAdminPage />} />
        <Route path="bao-gia" element={<QuotationsAdminPage />} />
        <Route path="khach-hang" element={<CustomersAdminPage />} />
        <Route path="ton-kho" element={<InventoryAdminPage />} />
        <Route path="cau-hinh" element={<SettingsPage />} />
        {Object.entries(RESOURCES).map(([path, config]) => (
          <Route key={path} path={path} element={<ResourcePage config={config} />} />
        ))}
      </Route>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="san-pham" element={<ProductsPage />} />
        <Route path="san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="gio-hang" element={<CartPage />} />
        <Route path="thanh-toan" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="bao-gia" element={<QuotePage />} />
        <Route path="so-sanh" element={<ComparePage />} />
        <Route path="dang-nhap" element={<LoginPage />} />
        <Route path="dang-ky" element={<RegisterPage />} />
        <Route path="tai-khoan" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="don-hang/:code" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="gioi-thieu" element={<AboutPage />} />
        <Route path="lien-he" element={<ContactPage />} />
        <Route path="thiet-ke" element={<DesignSystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
