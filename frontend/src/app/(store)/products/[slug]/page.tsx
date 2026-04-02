import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/server-api";
import type { Category } from "@/lib/types";
import ProductDetails from "./ProductDetails";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} — ALFPAT ELECTRONICS`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const categoryName =
    typeof product.category === "object"
      ? (product.category as Category).name
      : (product.category as string);

  const categorySlug =
    typeof product.category === "object"
      ? (product.category as Category).slug
      : "";

  const relatedProducts = categorySlug
    ? await getRelatedProducts(categorySlug, product._id)
    : [];

  return (
    <ProductDetails
      product={product}
      categoryName={categoryName}
      categorySlug={categorySlug}
      relatedProducts={relatedProducts}
    />
  );
}
