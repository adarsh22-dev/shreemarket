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
import ViewProduct from './pages/vendor/ViewProduct';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorShipping from './pages/vendor/VendorShipping';

import VendorReturnManagement from './pages/vendor/VendorReturnManagement';
import VendorInvoiceManagement from './pages/vendor/VendorInvoiceManagement';
import VendorProductAnalytics from './pages/vendor/VendorProductAnalytics';
import VendorWholesalePortal from './pages/vendor/VendorWholesalePortal';
import VendorInventoryHistory from './pages/vendor/VendorInventoryHistory';
import VendorDemographics from './pages/vendor/VendorDemographics';
import VendorNotifications from './pages/vendor/VendorNotifications';
import VendorAbandonedOrders from './pages/vendor/VendorAbandonedOrders';
import VendorFulfillments from './pages/vendor/VendorFulfillments';
import VendorReports from './pages/vendor/VendorReports';
import VendorSubscription from './pages/vendor/VendorSubscription';
import VendorProductSchedules from './pages/vendor/VendorProductSchedules';
import VendorReviewTemplates from './pages/vendor/VendorReviewTemplates';
import VendorQRCode from './pages/vendor/VendorQRCode';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorProfile from './pages/VendorProfile';
import VendorPortalPage from './pages/VendorPortalPage';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import AdminAnalytics from './pages/admin/Adminanalytics';
import Vendormanagement from './pages/admin/Vendormanagement';
import VendorActivities from './pages/admin/VendorActivities';
import ProductManagement from './pages/admin/Productmanagement';
import RealLifeLooks from './pages/admin/RealLifeLooks';
import AdminContacts from './pages/admin/AdminContacts';
import TestimonialManagement from './pages/admin/TestimonialManagement';

import OrderManagement from './pages/admin/AdminOrdermanagement';
import AdminReturnsrefunds from './pages/admin/AdminReturnsrefunds';
import AdminCancellations from './pages/admin/AdminCancellations';
import AdminDeliverypartners from './pages/admin/AdminDeliverypartners';

import AdminPayoutRequests from './pages/admin/AdminPayoutRequests';
import AdminCommissionRules from './pages/admin/AdminCommissionRules';
import AdminPayoutScheduler from './pages/admin/AdminPayoutScheduler';
import AdminPaymentGatewayLogs from './pages/admin/AdminPaymentGatewayLogs';
import AdminGSTInvoices from './pages/admin/AdminGSTInvoices';
import AdminTaxRates from './pages/admin/AdminTaxRates';
import AdminCurrencies from './pages/admin/AdminCurrencies';
import AdminCustomerSegments from './pages/admin/AdminCustomerSegments';
import AdminAbandonedCarts from './pages/admin/AdminAbandonedCarts';
import AdminMarketplaceFees from './pages/admin/AdminMarketplaceFees';
import AdminInventoryAlerts from './pages/admin/AdminInventoryAlerts';

import CustomerManagement from './pages/admin/AdminCustomermanagement';
import LoyaltyPoints from './pages/admin/LoyaltyPoints';
import RefundHistory from './pages/admin/RefundHistory';

import AllTickets from './pages/admin/AllTickets';
import VendorTickets from './pages/admin/VendorTickets';
import CustomerTickets from './pages/admin/CustomerTickets';

import MarketingCoupons from './pages/admin/MarketingCoupons';
import FlashSales from './pages/admin/FlashSales';
import MarketingBanners from './pages/admin/MarketingBanners';
import PushNotifications from './pages/admin/PushNotifications';
import MarketingNewsletter from './pages/admin/MarketingNewsletter';
import ReferralProgram from './pages/admin/ReferralProgram';
import PendingReviews from './pages/admin/PendingReviews';
import ReportedReviews from './pages/admin/ReportedReviews';
import VendorRatings from './pages/admin/VendorRatings';
import CmsPages from './pages/admin/CmsPages';
import CmsBlog from './pages/admin/CmsBlog';
import CmsHomepageBuilder from './pages/admin/CmsHomepageBuilder';
import CmsFaqs from './pages/admin/CmsFaqs';
import CmsRedirects from './pages/admin/CmsRedirects';
import CmsCustomCode from './pages/admin/CmsCustomCode';
import AdminShippingZones from './pages/admin/AdminShippingZones';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminGiftCards from './pages/admin/AdminGiftCards';
import AdminBulkStock from './pages/admin/AdminBulkStock';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminActivityDashboard from './pages/admin/AdminActivityDashboard';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import AdminTaxReports from './pages/admin/AdminTaxReports';
import AdminReportBuilder from './pages/admin/AdminReportBuilder';
import AdminSizeGuides from './pages/admin/AdminSizeGuides';
import AdminCompetitorPrices from './pages/admin/AdminCompetitorPrices';
import AdminProductBundles from './pages/admin/AdminProductBundles';
import AdminWholesalers from './pages/admin/AdminWholesalers';
import UsersRoles from './pages/admin/AdminUsersroles';
import AdminSettings from './pages/admin/Adminsettings';
import ProtectedRoute from './components/ProtectedRoute';
import VendorProtectedRoute from './components/VendorProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import OrdersPage from './pages/OrdersPage';
import OurStory from './pages/OurStory';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import FAQPage from './pages/FAQPage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import StaffInventorySystem from './pages/vendor/vendorStaffMgmt';
import VendorGuide from './pages/vendor/VendorGuide';
import VendorPayout from './pages/vendor/VendorPayouts';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorStoreManager from './pages/vendor/VendorStoreManager';
import VendorHelpCenter from './pages/vendor/VendorStoreLocatorHelp'
import VendorCoupons from './pages/vendor/VendorCoupons';
import VendorReviews from './pages/vendor/VendorReviews';
import CustomerRoute from './components/CustomerRoute';
import './index.css';

import { Toaster } from 'react-hot-toast';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import WishlistPage from './pages/WishlistPage';
import WholesalePage from './pages/WholesalePage';
import WholesaleProductPage from './pages/wholesaler/WholesaleProductPage';
import WholesalerRegisterPage from './pages/WholesalerRegisterPage';
import WholesalerLoginPage from './pages/WholesalerLoginPage';
import WholesalerProtectedRoute from './components/WholesalerProtectedRoute';
import WholesalerLayout from './components/wholesaler/WholesalerLayout';
import WholesalerDashboard from './pages/wholesaler/WholesalerDashboard';
import WholesalerOrders from './pages/wholesaler/WholesalerOrders';
import WholesalerProducts from './pages/wholesaler/WholesalerProducts';
import WholesalerRFQs from './pages/wholesaler/WholesalerRFQs';
import WholesalerSettings from './pages/wholesaler/WholesalerSettings';
import ComparePage from './pages/ComparePage';
import LoyaltyPage from './pages/LoyaltyPage';

// wooai
import Dashboard    from './pages/wooai/Dashboard';
import Assignments  from './pages/wooai/Assignments';
import QuickActions from './pages/wooai/Quickactions';
import Policies     from './pages/wooai/Policies';
import Callbacks    from './pages/wooai/Callbacks';
import Chatlogs     from './pages/wooai/Chatlogs';
import Settings     from './pages/wooai/Settings';
import InstallPrompt from './components/InstallPrompt';
// App.jsx — change to match exact filename case
import ScrollToTopButton from "./components/Scrolltotopbutton";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
          <ScrollToTopButton />
          <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <InstallPrompt />
            <Routes>
              <Route path="/" element={<CustomerRoute><HomePage /></CustomerRoute>} />
              <Route path="/shop" element={<CustomerRoute><ShopPage /></CustomerRoute>} />
              <Route path="/compare" element={<CustomerRoute><ComparePage /></CustomerRoute>} />

              <Route path="/wholesaler/register" element={<WholesalerRegisterPage />} />
              <Route path="/wholesaler/login" element={<WholesalerLoginPage />} />
              <Route path="/our-story" element={<CustomerRoute><OurStory /></CustomerRoute>} />
              <Route path="/about" element={<CustomerRoute><AboutPage /></CustomerRoute>} />
              <Route path="/legal" element={<CustomerRoute><LegalPage /></CustomerRoute>} />
              <Route path="/product/:id" element={<CustomerRoute><ProductPage /></CustomerRoute>} />
              <Route path="/shop/:category" element={<CustomerRoute><ProductListingPage /></CustomerRoute>} />
              <Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
              <Route path="/checkout" element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />
              <Route path="/settings" element={<CustomerRoute><SettingsPage /></CustomerRoute>} />
              <Route path="/orders" element={<CustomerRoute><OrdersPage /></CustomerRoute>} />
              <Route path="/login" element={<CustomerRoute><LoginPage /></CustomerRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/support/contact" element={<ContactPage />} />
              <Route path="/support/privacy" element={<PrivacyPage />} />
              <Route path="/support/terms" element={<TermsPage />} />
              <Route path="/support/shipping" element={<ShippingPage />} />
              <Route path="/support/returns" element={<ReturnsPage />} />
              <Route path="/support/faq" element={<FAQPage />} />
              <Route path="/vendor/vendor-profile" element={<VendorProfile />} />
              <Route path="/vendorprofile" element={<VendorProfile />} />
              <Route path="/vendorportalpage" element={<VendorPortalPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/loyalty" element={<LoyaltyPage />} />
              </Route>
              <Route element={<VendorProtectedRoute />}>
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorProducts />} />
                <Route path="/vendor/products/add" element={<AddProduct />} />
                <Route path="/vendor/products/edit/:id" element={<AddProduct />} />
                <Route path="/vendor/products/view/:id" element={<ViewProduct />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                <Route path="/vendor/shipping" element={<VendorShipping />} />
                <Route path="/vendor/returns" element={<VendorReturnManagement />} />
                <Route path="/vendor/notifications" element={<VendorNotifications />} />
                <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                <Route path="/vendor/staffmanagement" element={<StaffInventorySystem />} />
                <Route path="/vendor/guide" element={<VendorGuide />} />
                <Route path="/vendor/payouts" element={<VendorPayout />} />
                <Route path="/vendor/help" element={<VendorHelpCenter />} />
                <Route path="/vendor/settings" element={<VendorSettings />} />
                <Route path="/vendor/coupons" element={<VendorCoupons />} />
                <Route path="/vendor/reviews" element={<VendorReviews />} />
                <Route path="/vendor/invoices" element={<VendorInvoiceManagement />} />
                <Route path="/vendor/product-analytics" element={<VendorProductAnalytics />} />
                <Route path="/vendor/wholesale" element={<VendorWholesalePortal />} />
                <Route path="/vendor/inventory-history" element={<VendorInventoryHistory />} />
                <Route path="/vendor/customer-demographics" element={<VendorDemographics />} />
                <Route path="/vendor/abandoned-orders" element={<VendorAbandonedOrders />} />
                <Route path="/vendor/fulfillments" element={<VendorFulfillments />} />
                <Route path="/vendor/reports" element={<VendorReports />} />
                <Route path="/vendor/subscription" element={<VendorSubscription />} />
                <Route path="/vendor/product-schedules" element={<VendorProductSchedules />} />
                <Route path="/vendor/review-templates" element={<VendorReviewTemplates />} />
                <Route path="/vendor/qr-codes" element={<VendorQRCode />} />
                <Route path="/vendor/stores" element={<VendorStoreManager />} />
              </Route>

              <Route element={<WholesalerProtectedRoute />}>
                <Route path="/wholesaler" element={<WholesalerLayout />}>
                  <Route index element={<WholesalerDashboard />} />
                  <Route path="dashboard" element={<WholesalerDashboard />} />
                  <Route path="orders" element={<WholesalerOrders />} />
                  <Route path="products" element={<WholesalerProducts />} />
                  <Route path="rfqs" element={<WholesalerRFQs />} />
                  <Route path="settings" element={<WholesalerSettings />} />
                </Route>
              </Route>

              <Route element={<WholesalerProtectedRoute />}>
                <Route path="/wholesale" element={<WholesalePage />} />
                <Route path="/wholesale/product/:id" element={<WholesaleProductPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={[1]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />

                  {/* Vendor Management Section */}
                  <Route path="vendors" element={<Vendormanagement />} />
                  <Route path="vendors/tab/:tab" element={<Vendormanagement />} />
                  <Route path="vendors/activities" element={<VendorActivities />} />

                  {/* Wholesaler Section */}
                  <Route path="wholesalers" element={<AdminWholesalers />} />

                  {/* Products Section */}
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="products/tab/:tab" element={<ProductManagement />} />

                  {/* Orders Section */}
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="orders/returns" element={<AdminReturnsrefunds />} />
                  <Route path="orders/cancellations" element={<AdminCancellations />} />
                  <Route path="orders/delivery" element={<AdminDeliverypartners />} />

                  {/* Payouts Section */}
                  <Route path="payouts" element={<AdminPayoutRequests />} />
                  <Route path="payouts/commission" element={<AdminCommissionRules />} />
                  <Route path="payouts/scheduler" element={<AdminPayoutScheduler />} />
                  <Route path="payouts/gateway" element={<AdminPaymentGatewayLogs />} />
                  <Route path="payouts/gst" element={<AdminGSTInvoices />} />

                  {/* Tax & GST Section */}
                  <Route path="tax" element={<AdminTaxRates />} />
                  <Route path="currencies" element={<AdminCurrencies />} />
                  <Route path="customer-segments" element={<AdminCustomerSegments />} />
                  <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
                  <Route path="marketplace-fees" element={<AdminMarketplaceFees />} />
                  <Route path="inventory-alerts" element={<AdminInventoryAlerts />} />

                  {/* Customers Section */}
                  <Route path="customers" element={<CustomerManagement />} />
                  <Route path="customers/loyalty" element={<LoyaltyPoints />} />
                  <Route path="customers/refunds" element={<RefundHistory />} />

                  {/* Support Section */}
                  <Route path="support" element={<AllTickets />} />
                  <Route path="support/vendor" element={<VendorTickets />} />
                  <Route path="support/customer" element={<CustomerTickets />} />
                  <Route path="support/contacts" element={<AdminContacts />} />

                  {/* Marketing Section */}
                  <Route path="marketing/coupons" element={<MarketingCoupons />} />
                  <Route path="marketing/flash-sales" element={<FlashSales />} />
                  <Route path="marketing/banners" element={<MarketingBanners />} />
                  <Route path="marketing/notifications" element={<PushNotifications />} />
                  <Route path="marketing/newsletter" element={<MarketingNewsletter />} />
                  <Route path="marketing/referrals" element={<ReferralProgram />} />

                  {/* Reviews Section */}
                  <Route path="reviews" element={<PendingReviews />} />
                  <Route path="reviews/reported" element={<ReportedReviews />} />
                  <Route path="reviews/vendors" element={<VendorRatings />} />
                  <Route path="reviews/testimonials" element={<TestimonialManagement />} />

                  {/* CMS Section */}
                  <Route path="cms/pages" element={<CmsPages />} />
                  <Route path="cms/blog" element={<CmsBlog />} />
                  <Route path="cms/homepage" element={<CmsHomepageBuilder />} />
                  <Route path="cms/faqs" element={<CmsFaqs />} />
                  <Route path="cms/redirects" element={<CmsRedirects />} />
                  <Route path="cms/custom-code" element={<CmsCustomCode />} />

                  {/* Users Section */}
                  <Route path="users" element={<UsersRoles />} />
                  <Route path="roles" element={<UsersRoles />} />
                  <Route path="users/create" element={<AddUserPage />} />
                  <Route path="roles/create" element={<CreateRolePage />} />

                  {/* Shipping Zones */}
                  <Route path="orders/shipping-zones" element={<AdminShippingZones />} />

                  {/* Announcements */}
                  <Route path="marketing/announcements" element={<AdminAnnouncements />} />

                  {/* Gift Cards */}
                  <Route path="gift-cards" element={<AdminGiftCards />} />

                  {/* Product Bundles */}
                  <Route path="product-bundles" element={<AdminProductBundles />} />

                  {/* System */}
                  <Route path="system/bulk-stock" element={<AdminBulkStock />} />
                  <Route path="system/maintenance" element={<AdminMaintenance />} />
                  <Route path="system/activity" element={<AdminActivityDashboard />} />
                  <Route path="system/health" element={<AdminSystemHealth />} />

                  {/* Settings */}
                  <Route path="settings" element={<AdminSettings />} />

                  {/* Tax Reports */}
                  <Route path="tax-reports" element={<AdminTaxReports />} />

                  {/* Report Builder */}
                  <Route path="reports" element={<AdminReportBuilder />} />

                  {/* Size Guides */}
                  <Route path="size-guides" element={<AdminSizeGuides />} />

                  {/* Competitor Price Analysis */}
                  <Route path="competitor-prices" element={<AdminCompetitorPrices />} />

                  {/* Real-Life Looks */}
                  <Route path="real-life-looks" element={<RealLifeLooks />} />

                  {/* WooAI Section */}
                  <Route path="wooai/dashboard" element={<Dashboard />} />
                  <Route path="wooai/assignments" element={<Assignments />} />
                  <Route path="wooai/quick-actions" element={<QuickActions />} />
                  <Route path="wooai/policies" element={<Policies />} />
                  <Route path="wooai/callbacks" element={<Callbacks />} />
                  <Route path="wooai/chatlogs" element={<Chatlogs />} />
                  <Route path="wooai/settings" element={<Settings />} />
                </Route>
              </Route>
            </Routes>
          </Router>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
