import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../hooks';

// Auth screens
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import VendorRegisterScreen from '../screens/auth/VendorRegisterScreen';
import WholesalerRegisterScreen from '../screens/auth/WholesalerRegisterScreen';

// Consumer screens
import HomeScreen from '../screens/consumer/HomeScreen';
import ShopScreen from '../screens/consumer/ShopScreen';
import CartScreen from '../screens/consumer/CartScreen';
import OrdersScreen from '../screens/consumer/OrdersScreen';
import ProfileScreen from '../screens/consumer/ProfileScreen';
import ProductDetailScreen from '../screens/consumer/ProductDetailScreen';
import CategoryScreen from '../screens/consumer/CategoryScreen';
import SearchScreen from '../screens/consumer/SearchScreen';
import WishlistScreen from '../screens/consumer/WishlistScreen';
import CheckoutScreen from '../screens/consumer/CheckoutScreen';
import OrderDetailScreen from '../screens/consumer/OrderDetailScreen';
import AddressBookScreen from '../screens/consumer/AddressBookScreen';
import SettingsScreen from '../screens/consumer/SettingsScreen';
import NotificationsScreen from '../screens/consumer/NotificationsScreen';
import CompareScreen from '../screens/consumer/CompareScreen';
import ChatScreen from '../screens/consumer/ChatScreen';
import WalletScreen from '../screens/consumer/WalletScreen';
import LoyaltyScreen from '../screens/consumer/LoyaltyScreen';
import ReferralScreen from '../screens/consumer/ReferralScreen';

// Vendor screens
import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import VendorProductsScreen from '../screens/vendor/VendorProductsScreen';
import VendorAddProductScreen from '../screens/vendor/VendorAddProductScreen';
import VendorEditProductScreen from '../screens/vendor/VendorEditProductScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/vendor/VendorOrderDetailScreen';
import VendorAnalyticsScreen from '../screens/vendor/VendorAnalyticsScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';
import VendorSettingsScreen from '../screens/vendor/VendorSettingsScreen';
import VendorSubscriptionScreen from '../screens/vendor/VendorSubscriptionScreen';
import VendorPayoutsScreen from '../screens/vendor/VendorPayoutsScreen';
import VendorStaffScreen from '../screens/vendor/VendorStaffScreen';
import VendorKYCScreen from '../screens/vendor/VendorKYCScreen';
import VendorNotificationsScreen from '../screens/vendor/VendorNotificationsScreen';
import VendorChatScreen from '../screens/vendor/VendorChatScreen';

// Wholesaler screens
import WholesalerDashboardScreen from '../screens/wholesaler/WholesalerDashboardScreen';
import WholesalerProductsScreen from '../screens/wholesaler/WholesalerProductsScreen';
import WholesalerAddProductScreen from '../screens/wholesaler/WholesalerAddProductScreen';
import WholesalerEditProductScreen from '../screens/wholesaler/WholesalerEditProductScreen';
import WholesalerRFQsScreen from '../screens/wholesaler/WholesalerRFQsScreen';
import WholesalerRFQDetailScreen from '../screens/wholesaler/WholesalerRFQDetailScreen';
import WholesalerQuotesScreen from '../screens/wholesaler/WholesalerQuotesScreen';
import WholesalerOrdersScreen from '../screens/wholesaler/WholesalerOrdersScreen';
import WholesalerOrderDetailScreen from '../screens/wholesaler/WholesalerOrderDetailScreen';
import WholesalerAnalyticsScreen from '../screens/wholesaler/WholesalerAnalyticsScreen';
import WholesalerProfileScreen from '../screens/wholesaler/WholesalerProfileScreen';
import WholesalerSettingsScreen from '../screens/wholesaler/WholesalerSettingsScreen';
import WholesalerPayoutsScreen from '../screens/wholesaler/WholesalerPayoutsScreen';
import WholesalerKYCScreen from '../screens/wholesaler/WholesalerKYCScreen';
import WholesalerNotificationsScreen from '../screens/wholesaler/WholesalerNotificationsScreen';
import WholesalerChatScreen from '../screens/wholesaler/WholesalerChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Auth Stack ──
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
    <Stack.Screen name="WholesalerRegister" component={WholesalerRegisterScreen} />
  </Stack.Navigator>
);

// ── Consumer Tab ──
const ConsumerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, height: 70, paddingBottom: 10 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      tabBarIconStyle: { marginBottom: 4 },
      tabBarIcon: ({ focused, color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: focused ? 'home' : 'home-outline',
          Shop: focused ? 'storefront' : 'storefront-outline',
          Cart: focused ? 'cart' : 'cart-outline',
          Orders: focused ? 'bag-handle' : 'bag-handle-outline',
          Profile: focused ? 'person' : 'person-outline',
        };
        return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Shop" component={ShopScreen} />
    <Tab.Screen name="Cart" component={CartScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ── Vendor Tab ──
const VendorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.vendor,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, height: 70, paddingBottom: 10 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Dashboard: focused ? 'grid' : 'grid-outline',
          Products: focused ? 'cube' : 'cube-outline',
          Orders: focused ? 'bag-handle' : 'bag-handle-outline',
          Analytics: focused ? 'bar-chart' : 'bar-chart-outline',
          Profile: focused ? 'person' : 'person-outline',
        };
        return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
    <Tab.Screen name="Products" component={VendorProductsScreen} />
    <Tab.Screen name="Orders" component={VendorOrdersScreen} />
    <Tab.Screen name="Analytics" component={VendorAnalyticsScreen} />
    <Tab.Screen name="Profile" component={VendorProfileScreen} />
  </Tab.Navigator>
);

// ── Wholesaler Tab ──
const WholesalerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.wholesaler,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, height: 70, paddingBottom: 10 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Dashboard: focused ? 'grid' : 'grid-outline',
          Products: focused ? 'cube' : 'cube-outline',
          RFQs: focused ? 'document-text' : 'document-text-outline',
          Orders: focused ? 'bag-handle' : 'bag-handle-outline',
          Profile: focused ? 'person' : 'person-outline',
        };
        return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={WholesalerDashboardScreen} />
    <Tab.Screen name="Products" component={WholesalerProductsScreen} />
    <Tab.Screen name="RFQs" component={WholesalerRFQsScreen} />
    <Tab.Screen name="Orders" component={WholesalerOrdersScreen} />
    <Tab.Screen name="Profile" component={WholesalerProfileScreen} />
  </Tab.Navigator>
);

// ── App Navigator (auth gate) ──
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth();

  useEffect(() => { checkAuth(); }, []);

  const { isGuest } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isGuest || !isAuthenticated) {
    if (isGuest) return <ConsumerTabs />;
    else return <AuthStack />;
  }

  if (user?.roleId === 3) return <VendorTabs />;
  return <ConsumerTabs />;
};

// ── Root Navigator ──
export const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="App" component={AppNavigator} />
    <Stack.Screen name="Auth" component={AuthStack} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Compare" component={CompareScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Search" component={SearchScreen} />
  </Stack.Navigator>);
