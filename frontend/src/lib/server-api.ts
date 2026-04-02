import type { Product, Category, PaginatedResponse } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchJSON<T>(url: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API}${url}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  return (await fetchJSON<Category[]>("/categories")) ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const data = await fetchJSON<PaginatedResponse<Product>>(
    "/products?featured=true&limit=8"
  );
  return data?.data ?? [];
}

export async function getLatestProducts(): Promise<Product[]> {
  const data = await fetchJSON<PaginatedResponse<Product>>(
    "/products?limit=8"
  );
  return data?.data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return await fetchJSON<Product>(`/products/${slug}`);
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
  limit = 4
): Promise<Product[]> {
  const data = await fetchJSON<PaginatedResponse<Product>>(
    `/products?category=${categorySlug}&limit=${limit + 1}`
  );
  return (data?.data ?? []).filter((p) => p._id !== excludeId).slice(0, limit);
}
