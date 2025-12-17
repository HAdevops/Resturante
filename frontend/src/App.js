import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import TrackingPage from "./pages/TrackingPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";

import KitchenDashboard from "./pages/dashboards/KitchenDashboard";
import CashierDashboard from "./pages/dashboards/CashierDashboard";
import DriverDashboard from "./pages/dashboards/DriverDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="App dark">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/panier" element={<CartPage />} />
              <Route path="/paiement" element={<CheckoutPage />} />
              <Route path="/suivi/:orderNumber" element={<TrackingPage />} />
              <Route path="/suivi" element={<TrackingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/inscription" element={<RegisterPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              
              <Route path="/dashboard/cuisine" element={
                <ProtectedRoute allowedRoles={["CUISINE", "SUPER_ADMIN"]}>
                  <KitchenDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/caisse" element={
                <ProtectedRoute allowedRoles={["CAISSE", "SUPER_ADMIN"]}>
                  <CashierDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/livreur" element={
                <ProtectedRoute allowedRoles={["LIVREUR", "SUPER_ADMIN"]}>
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster richColors position="top-center" />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
