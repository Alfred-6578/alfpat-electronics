export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: Category | string;
  brand?: string;
  stock: number;
  specs?: { key: string; value: string }[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  productsCount?: number;
}

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  image: string;
  stock: number;
  qty: number;
}

export interface SavedAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  address?: Address;
  savedAddresses?: SavedAddress[];
  googleId?: string;
  token?: string;
  createdAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
}

export interface ShippingAddress extends Address {
  fullName: string;
  phone: string;
  email?: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  image: string;
  qty: number;
  price: number;
}

export interface Order {
  _id: string;
  user?: string | User;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  paymentReference: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled";
  whatsappNotified: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export type SortOption = "newest" | "price_asc" | "price_desc";

export interface ProductFilters {
  search: string;
  category: string;
  sort: SortOption;
  page: number;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  note: string;
}

export interface CheckoutFormErrors {
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
}

export interface CreateOrderPayload {
  items: { product: string; qty: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
  };
}

export interface CreateOrderResponse {
  order: Order;
  paymentUrl: string;
}

export interface InitializePaymentPayload {
  items: { _id: string; qty: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
  };
}

export interface InitializePaymentResponse {
  paymentUrl: string;
  reference: string;
}

export type VerifyStatus =
  | "paid"
  | "failed"
  | "pending"
  | "processing"
  | "not_initialized"
  | "creating"
  | "unknown";

export interface PaymentStatusResponse {
  found: boolean;
  status?: VerifyStatus;
  order?: Order;
  message?: string;
  error?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  googleId?: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
}

export interface CustomerDetail extends Customer {
  orders: Order[];
  savedAddresses?: SavedAddress[];
}

export interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  images: string[];
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
  lowStockProducts: LowStockProduct[];
}
