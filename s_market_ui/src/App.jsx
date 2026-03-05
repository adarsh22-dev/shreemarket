import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import ProductListingPage from './pages/ProductListingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddUserPage from './pages/admin/AddUserPage';
import CreateRolePage from './pages/admin/CreateRolePage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import AddProduct from './pages/vendor/AddProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorShipping from './pages/vendor/VendorShipping';
import VendorNotifications from './pages/vendor/VendorNotifications';
import VendorPromotions from './pages/vendor/VendorPromotions';
import CreatePromotion from './pages/vendor/CreatePromotion';
import PromotionDetails from './pages/vendor/PromotionDetails';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import OrdersPage from './pages/OrdersPage';
import OurStory from './pages/OurStory';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import FAQPage from './pages/FAQPage';
import StaffInventorySystem from './pages/vendor/vendorStaffMgmt';
import VendorGuide from './pages/vendor/VendorGuide';
import VendorPayout from './pages/vendor/VendorPayouts';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorHelpCenter from './pages/vendor/VendorStoreLocatorHelp'
import VendorReviews from './pages/vendor/VendorReviews';
import './index.css';

import { Toaster } from 'react-hot-toast';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { CartProvider } from './context/CartContext';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <CartProvider>
        <Router>
          <Toaster position="top-center" reverseOrder={false} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/shop/:category" element={<ProductListingPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/support/contact" element={<ContactPage />} />
            <Route path="/support/privacy" element={<PrivacyPage />} />
            <Route path="/support/terms" element={<TermsPage />} />
            <Route path="/support/shipping" element={<ShippingPage />} />
            <Route path="/support/returns" element={<ReturnsPage />} />
            <Route path="/support/faq" element={<FAQPage />} />
            <Route element={<ProtectedRoute allowedRoles={[3]} />}>
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products" element={<VendorProducts />} />
              <Route path="/vendor/products/add" element={<AddProduct />} />
              <Route path="/vendor/products/edit/:id" element={<AddProduct />} />
              <Route path="/vendor/orders" element={<VendorOrders />} />
              <Route path="/vendor/shipping" element={<VendorShipping />} />
              <Route path="/vendor/notifications" element={<VendorNotifications />} />
              <Route path="/vendor/promotions" element={<VendorPromotions />} />
              <Route path="/vendor/promotions/create" element={<CreatePromotion />} />
              <Route path="/vendor/promotions/:id" element={<PromotionDetails />} />
              <Route path="/vendor/analytics" element={<VendorAnalytics />} />
              <Route path="/vendor/staffmanagement" element={<StaffInventorySystem />} />
              <Route path="/vendor/guide" element={<VendorGuide />} />
              <Route path="/vendor/payouts" element={<VendorPayout />} />
              <Route path="/vendor/help" element={<VendorHelpCenter />} />
              <Route path="/vendor/settings" element={<VendorSettings />} />
              <Route path="/vendor/reviews" element={<VendorReviews />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[1]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users/create" element={<AddUserPage />} />
              <Route path="/admin/roles/create" element={<CreateRolePage />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
