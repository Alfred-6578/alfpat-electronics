"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createAdminProduct } from "@/lib/client-api";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

const ADMIN_BASE = "/mngmt-x7k9q2";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Product>) => {
    setLoading(true);
    try {
      await createAdminProduct(data);
      toast.success("Product created!");
      router.push(`${ADMIN_BASE}/products`);
    } catch {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        className="text-2xl font-bold text-[#0B1B3A] mb-6"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Add New Product
      </h1>
      <ProductForm initialData={null} onSubmit={handleSubmit} isLoading={loading} />
    </div>
  );
}
