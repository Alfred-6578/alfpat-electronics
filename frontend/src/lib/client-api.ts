import api from "@/lib/api";
import type {
  Product,
  Category,
  Order,
  PaginatedResponse,
  ProductFilters,
  CreateOrderPayload,
  CreateOrderResponse,
  InitializePaymentPayload,
  InitializePaymentResponse,
  PaymentStatusResponse,
  SavedAddress,
  DashboardStats,
  Customer,
  CustomerDetail,
  CartItem,
  WishlistItem,
} from "@/lib/types";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function fetchProducts(
  filters: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  params.set("page", String(filters.page));
  params.set("limit", "12");

  const { data } = await api.get<PaginatedResponse<Product>>(
    `/products?${params.toString()}`
  );
  return data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const { data } = await api.post<CreateOrderResponse>("/orders", payload);
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function verifyPayment(reference: string): Promise<Order> {
  const { data } = await api.post<Order>("/orders/verify", { reference });
  return data;
}

export async function fetchMyOrders(page = 1): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>(`/orders/my?page=${page}&limit=10`);
  return data;
}

export async function initializePayment(payload: InitializePaymentPayload): Promise<InitializePaymentResponse> {
  const { data } = await api.post<InitializePaymentResponse>("/payments/initialize", payload);
  return data;
}

export async function getOrderByReference(reference: string): Promise<PaymentStatusResponse> {
  const { data } = await api.get<PaymentStatusResponse>(`/payments/order/${reference}`);
  return data;
}

// Addresses
export async function fetchAddresses(): Promise<SavedAddress[]> {
  const { data } = await api.get<SavedAddress[]>("/users/addresses");
  return data;
}

export async function addNewAddress(address: Omit<SavedAddress, "_id">): Promise<SavedAddress[]> {
  const { data } = await api.post<SavedAddress[]>("/users/addresses", address);
  return data;
}

export async function deleteAddress(addressId: string): Promise<SavedAddress[]> {
  const { data } = await api.delete<SavedAddress[]>(`/users/addresses/${addressId}`);
  return data;
}

// Cart sync
export async function fetchDBCart(): Promise<CartItem[]> {
  const { data } = await api.get<CartItem[]>("/cart");
  return data;
}

export async function saveDBCart(items: CartItem[]): Promise<void> {
  await api.put("/cart", { items });
}

export async function mergeCart(localItems: CartItem[]): Promise<CartItem[]> {
  const { data } = await api.post<CartItem[]>("/cart/merge", { localItems });
  return data;
}

export async function clearDBCart(): Promise<void> {
  await api.delete("/cart");
}

// Wishlist sync
export async function fetchDBWishlist(): Promise<WishlistItem[]> {
  const { data } = await api.get<WishlistItem[]>("/wishlist");
  return data;
}

export async function saveDBWishlist(items: WishlistItem[]): Promise<void> {
  await api.put("/wishlist", { items });
}

export async function mergeWishlist(localItems: WishlistItem[]): Promise<WishlistItem[]> {
  const { data } = await api.post<WishlistItem[]>("/wishlist/merge", { localItems });
  return data;
}

export async function clearDBWishlist(): Promise<void> {
  await api.delete("/wishlist");
}

// Upload
export async function uploadImage(file: File): Promise<{ url: string; public_id: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post<{ url: string; public_id: string }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Admin
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/dashboard");
  return data;
}

export async function fetchAdminProducts(page = 1, limit = 20): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Product>>(`/admin/products?page=${page}&limit=${limit}`);
  return data;
}

export async function fetchAdminProduct(id: string): Promise<Product> {
  const res = await api.get<PaginatedResponse<Product>>(`/admin/products?page=1&limit=100`);
  const product = res.data.data.find((p: Product) => p._id === id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function createAdminProduct(productData: Partial<Product>): Promise<Product> {
  const { data } = await api.post<Product>("/admin/products", productData);
  return data;
}

export async function updateAdminProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const { data } = await api.put<Product>(`/admin/products/${id}`, productData);
  return data;
}

export async function fetchAdminOrders(page = 1, limit = 20): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>(`/admin/orders?page=${page}&limit=${limit}`);
  return data;
}

export async function updateOrderStatus(id: string, orderStatus: string): Promise<Order> {
  const { data } = await api.put<Order>(`/admin/orders/${id}`, { orderStatus });
  return data;
}

export async function createCategory(catData: { name: string; image?: string; description?: string }): Promise<Category> {
  const { data } = await api.post<Category>("/categories", catData);
  return data;
}

export async function updateCategory(id: string, catData: { name?: string; image?: string; description?: string }): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, catData);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function fetchCustomers(page = 1, search = ""): Promise<PaginatedResponse<Customer>> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  const { data } = await api.get<PaginatedResponse<Customer>>(`/admin/customers?${params}`);
  return data;
}

export async function createCustomer(userData: { name: string; email: string; password: string; phone?: string; role?: string }): Promise<Customer> {
  const { data } = await api.post<Customer>("/admin/customers", userData);
  return data;
}

export async function updateCustomerRole(id: string, role: string): Promise<{ _id: string; role: string }> {
  const { data } = await api.put<{ _id: string; role: string }>(`/admin/customers/${id}/role`, { role });
  return data;
}

export async function toggleSuspendCustomer(id: string): Promise<{ _id: string; isSuspended: boolean }> {
  const { data } = await api.put<{ _id: string; isSuspended: boolean }>(`/admin/customers/${id}/suspend`);
  return data;
}

export async function deleteCustomerApi(id: string): Promise<void> {
  await api.delete(`/admin/customers/${id}`);
}

export async function fetchCustomerDetail(id: string): Promise<CustomerDetail> {
  const { data } = await api.get<CustomerDetail>(`/admin/customers/${id}`);
  return data;
}
