import { CartProvider } from "./contexts/CartContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import { Router } from "./router/Router";

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <MainLayout>
            <Router />
          </MainLayout>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}