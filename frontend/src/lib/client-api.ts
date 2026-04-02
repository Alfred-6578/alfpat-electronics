import api from "@/lib/api";
import type {
  Product,
  Category,
  PaginatedResponse,
  ProductFilters,
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
