import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CompareProvider } from "./context/CompareContext";
import { SiteConfigProvider } from "./context/SiteConfigContext";
import { initAnalytics } from "./utils/analytics";
import "./styles/index.css";

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteConfigProvider>
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <App />
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </SiteConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
