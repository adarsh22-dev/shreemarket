export type Role = 'consumer' | 'vendor' | 'wholesaler';
export type AuthTab = 'consumer' | 'vendor' | 'wholesaler';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roleId: number;
  status?: string;
  avatar?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AuthState {
  user: User | null;
  userId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  isVendorLogin?: boolean;
}

export interface LoginResponse {
  message: string;
  userId: number;
  fullName: string;
  roleId: number;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ProductMedia {
  id: number;
  fileName: string;
  fileType: string;
  isPrimary: boolean;
  mediaType: string;
  customThumbnail?: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  value: string;
  visible: boolean;
}

export interface ProductVariation {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  useMainPricing: boolean;
  imageFileName?: string;
}

export interface ProductTag {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessDescription?: string;
  city?: string;
  country?: string;
  avatar?: string;
  stores?: Store[];
}

export interface Store {
  id: number;
  storeName: string;
  storeLogo?: string;
  storeDescription?: string;
  city?: string;
  country?: string;
}

export interface Product {
  id: number;
  name: string;
  type: string;
  category: string;
  subCategory: string;
  brand: string;
  sku: string;
  status: string;
  shortDescription: string;
  description?: string;
  regularPrice: number;
  discountPrice?: number;
  initialStock: number;
  supportsWholesale: boolean;
  wholesalePrice?: number;
  minimumWholesaleQuantity?: number;
  wholesaleOnly: boolean;
  weight: number;
  length: number;
  width: number;
  height: number;
  shippingClass: string;
  taxStatus: string;
  taxClass: string;
  hsnCode: string;
  isFeatured: boolean;
  vendorId: number;
  approvalStatus: string;
  averageRating: number;
  reviewCount: number;
  bookingCount: number;
  createdAt: number;
  updatedAt: number;
  media: ProductMedia[];
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  tags: ProductTag[];
  pricingTiers?: PricingTier[];
  linkedProducts?: LinkedProduct[];
  instagramFeedConfig?: string;
  instagramFeedLayout?: string;
  manufacturerLayout?: string;
}

export interface PricingTier {
  id: number;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice?: number;
  discountType?: string;
  discountValue?: number;
}

export interface LinkedProduct {
  id: number;
  linkedProductName: string;
  linkedType: 'UPSELL' | 'CROSS_SELL' | 'BOUGHT_TOGETHER';
}

export interface SubCategory {
  id: number;
  name: string;
  slug?: string;
  status?: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  subCategories: SubCategory[];
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  variant?: string;
  isSaved: boolean;
  addedAt: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
  variant?: string;
  isSaved?: boolean;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  datePlaced: number;
  totalAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  taxRate: number;
  tcsAmount: number;
  status: string;
  productQuantities: Record<string, number>;
  vendorId: number;
  customerName: string;
  deliveryLocation: string;
  estimatedDelivery: string;
  paymentId?: string;
  paymentMethod: string;
  trackingNumber?: string;
  deliveryPartner?: string;
  deliveryStatus?: string;
  deliveredAt?: number;
}

export interface CreateOrderRequest {
  totalAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  taxRate: number;
  tcsAmount: number;
  status: string;
  productQuantities: Record<string, number>;
  vendorId: number;
  customerName: string;
  deliveryLocation: string;
  estimatedDelivery: string;
  paymentId?: string;
  paymentMethod: string;
}

export interface Address {
  id: number;
  userId: number;
  roleId?: number;
  title: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  defaultAddress: boolean;
}

export interface HomepageSection {
  id: number;
  sectionType: string;
  sortOrder: number;
  visible: boolean;
  label: string;
  configJson?: string;
}

export interface Review {
  id: number;
  product?: { id: number; name: string };
  userId?: number;
  rating: number;
  title: string;
  text: string;
  reviewerName: string;
  verifiedBuyer: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: number;
  replyDate?: number;
  vendorReply?: string;
  images?: string[];
  videos?: string[];
}

export interface WishlistItem {
  id: number;
  product: Product;
  createdAt: number;
}
