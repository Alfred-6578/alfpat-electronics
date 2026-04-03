"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { fetchAdminProduct, updateAdminProduct } from "@/lib/client-api";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

const ADMIN_BASE = "/mngmt-x7k9q2";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminProduct(id)
      .then(setProduct)
      .catch(() => toast.error("Product not found"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const handleSubmit = async (data: Partial<Product>) => {
    setSaving(true);
    try {
      await updateAdminProduct(id, data);
      toast.success("Product updated!");
      router.push(`${ADMIN_BASE}/products`);
    } catch {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold text-[#0B1B3A] mb-2">Product not found</p>
        <button
          onClick={() => router.push(`${ADMIN_BASE}/products`)}
          className="text-sm text-[#F97316] hover:text-[#EA6A0A] font-medium transition-colors"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-2xl font-bold text-[#0B1B3A] mb-6"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Edit Product
      </h1>
      <ProductForm initialData={product} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  );
}
