"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetchCategories, uploadImage } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import type { Product, Category } from "@/lib/types";

const ADMIN_BASE = "/mngmt-x7k9q2";

interface ProductFormProps {
  initialData: Partial<Product> | null;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  isLoading: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  discountPrice?: string;
  category?: string;
  stock?: string;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice?.toString() || "");
  const [images, setImages] = useState<string[]>(initialData?.images?.length ? initialData.images : []);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    initialData?.specs?.length ? initialData.specs : []
  );
  const [categoryId, setCategoryId] = useState(
    typeof initialData?.category === "object"
      ? (initialData.category as Category)._id
      : initialData?.category || ""
  );
  const [stock, setStock] = useState(initialData?.stock?.toString() || "0");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const priceNum = parseFloat(price) || 0;
  const discountNum = parseFloat(discountPrice) || 0;
  const savings = discountNum > 0 && discountNum < priceNum ? priceNum - discountNum : 0;
  const savingsPercent = savings > 0 ? Math.round((savings / priceNum) * 100) : 0;

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Product name is required";
    if (!description.trim()) e.description = "Description is required";
    if (!price || priceNum <= 0) e.price = "Price must be a positive number";
    if (discountNum > 0 && discountNum >= priceNum) e.discountPrice = "Must be less than regular price";
    if (!categoryId) e.category = "Please select a category";
    if (stock === "" || parseInt(stock) < 0) e.stock = "Stock must be 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name,
      description,
      brand: brand || undefined,
      price: priceNum,
      discountPrice: discountNum > 0 ? discountNum : undefined,
      images: images.filter((u) => u.trim()),
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
      category: categoryId,
      stock: parseInt(stock),
      isActive,
      isFeatured,
    });
  };

  const inputClass = (field?: keyof FormErrors) =>
    `w-full px-4 py-3 border rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:ring-2 transition-all ${
      field && errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
    }`;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Product Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#0B1B3A] mb-4">Product Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Product Name *</label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                  className={inputClass("name")}
                  placeholder="e.g. Samsung Galaxy A54 5G"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                {name && (
                  <p className="text-xs text-gray-400 italic mt-1">alfpat.com/products/{slug}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({ ...p, description: undefined })); }}
                  rows={5}
                  className={`${inputClass("description")} resize-y min-h-[120px]`}
                  placeholder="Describe the product..."
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Brand</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass()}
                  placeholder="e.g. Samsung, LG, Sony"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#0B1B3A] mb-4">Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Regular Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
                    className={`${inputClass("price")} pl-8`}
                    placeholder="0"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Discount Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => { setDiscountPrice(e.target.value); if (errors.discountPrice) setErrors((p) => ({ ...p, discountPrice: undefined })); }}
                    className={`${inputClass("discountPrice")} pl-8`}
                    placeholder="Optional"
                  />
                </div>
                {errors.discountPrice && <p className="text-xs text-red-500 mt-1">{errors.discountPrice}</p>}
              </div>
            </div>
            {savings > 0 && (
              <p className="text-sm text-green-600 mt-3">
                Customer saves {formatNaira(savings)} ({savingsPercent}% off)
              </p>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#0B1B3A] mb-4">Images</h3>

            {/* Image grid preview */}
            {images.filter((u) => u.trim()).length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {images.filter((u) => u.trim()).map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full rounded-xl object-cover border border-gray-100 bg-gray-50"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((u2) => u2 !== url))}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                setUploading(true);
                const newUrls: string[] = [];
                for (const file of Array.from(files)) {
                  try {
                    const result = await uploadImage(file);
                    newUrls.push(result.url);
                  } catch {
                    toast.error(`Failed to upload ${file.name}`);
                  }
                }
                if (newUrls.length) {
                  setImages((prev) => [...prev.filter((u) => u.trim()), ...newUrls]);
                }
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#F97316] transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="w-6 h-6 text-[#F97316] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-500">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium text-[#F97316]">Upload Images</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WebP • Click to browse</span>
                </>
              )}
            </button>

            {/* Or add URL */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or add URL</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (urlInput.trim()) {
                      setImages((prev) => [...prev.filter((u) => u.trim()), urlInput.trim()]);
                      setUrlInput("");
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    setImages((prev) => [...prev.filter((u) => u.trim()), urlInput.trim()]);
                    setUrlInput("");
                  }
                }}
                className="px-4 py-2.5 bg-gray-100 text-[#0B1B3A] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>

            {images.every((u) => !u.trim()) && (
              <p className="text-xs text-yellow-600 mt-3">⚠️ At least 1 image is recommended</p>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1B3A]">Specifications</h3>
              <button
                type="button"
                onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                className="text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors"
              >
                + Add Spec
              </button>
            </div>
            {specs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No specifications added</p>
            ) : (
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      value={spec.key}
                      onChange={(e) => {
                        const updated = [...specs];
                        updated[i] = { ...updated[i], key: e.target.value };
                        setSpecs(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316]"
                      placeholder="e.g. Capacity"
                    />
                    <input
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...specs];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setSpecs(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316]"
                      placeholder="e.g. 7kg"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Organisation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#0B1B3A] mb-4">Organisation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); if (errors.category) setErrors((p) => ({ ...p, category: undefined })); }}
                  className={`${inputClass("category")} cursor-pointer ${!categoryId ? "text-gray-400" : ""}`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => { setStock(e.target.value); if (errors.stock) setErrors((p) => ({ ...p, stock: undefined })); }}
                  className={inputClass("stock")}
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#0B1B3A] mb-4">Product Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0B1B3A]">Active</p>
                  <p className="text-xs text-gray-400">Show product on store</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? "bg-[#F97316]" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0B1B3A]">Featured</p>
                  <p className="text-xs text-gray-400">Show on homepage</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isFeatured ? "bg-[#F97316]" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isFeatured ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isLoading ? "Saving..." : initialData ? "Update Product" : "Save Product"}
            </button>
            <Link
              href={`${ADMIN_BASE}/products`}
              className="block text-center text-sm text-gray-400 hover:text-[#0B1B3A] transition-colors mt-3"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
