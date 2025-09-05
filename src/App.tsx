// src/App.tsx
 import { CartProvider } from "./contexts/CartContext";
 import { ProductsProvider } from "./contexts/ProductsContext";
 import { AuthProvider } from "./contexts/AuthContext";

 import MainLayout from "./layouts/MainLayout";
 import AuthLayout from "./layouts/AuthLayout";

 import { Route, Routes } from "react-router-dom";
 import Auth from "./pages/Auth";
 import Home from "./pages/Home";
 import Catalog from "./pages/Catalog";
 import Product from "./pages/Product";
 import Cart from "./pages/Cart";
 import Checkout from "./pages/Checkout";
 import Payment from "./pages/Payment";
 import Profile from "./pages/Profile";
 import NotFound from "./pages/NotFound";
 import PrivacyPolicy from "./pages/PrivacyPolicy";
 import TermsOfUse from "./pages/TermsOfUse";
 import Cookies from "./pages/Cookies";

 import { ConsentProvider, useConsent } from "./features/cookie-consent/ConsentContext";
 import CookieBanner from "./features/cookie-consent/CookieBanner";
 import { useEffect } from "react";
import Contacts from "./pages/Contact";
 
 // Пример условной загрузки скрипта аналитики (без сторонних либ)
 function useConditionalScript(enabled: boolean, src: string, id: string) {
   useEffect(() => {
     if (!enabled) return;
 
     if (document.getElementById(id)) return; // уже подключен
     const s = document.createElement("script");
     s.async = true;
     s.src = src;
     s.id = id;
     document.head.appendChild(s);
     return () => { s.remove(); };
   }, [enabled, src, id]);
 }
 
 const DemoAnalytics: React.FC = () => {
   const { isAllowed } = useConsent();
   const analyticsOn = isAllowed("analytics");
 
   // Подключаем любой ваш скрипт только при согласии
   useConditionalScript(analyticsOn, "/fake-analytics.js", "my-analytics");
    // return <div style={{ padding: 24 }}>Секция приложения. Аналитика: {analyticsOn ? "включена" : "выключена"}</div>;
   return <div style={{ padding: 24 }}></div>;
 };
 
 export default function App() {
  return (
    <ConsentProvider
      cookieName="myapp_consent"
      cookieDays={365}
      policyVersion={1}
      sameSite="Lax"
    >
      <CookieBanner policyLink="/cookies" />

      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfUse />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/contacts" element={<Contacts />} />
              </Route>

              <Route element={<AuthLayout />}>
                <Route path="/auth" element={<Auth />} />
              </Route>
            </Routes>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>

      <DemoAnalytics />
    </ConsentProvider>
  );
}