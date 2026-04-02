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
