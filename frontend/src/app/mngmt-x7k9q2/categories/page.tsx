"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
} from "@/lib/client-api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const slug = formName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openAdd = () => {
    setEditingCat(null);
    setFormName("");
    setFormImage("");
    setFormDesc("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormImage(cat.image || "");
    setFormDesc(cat.description || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat._id, {
          name: formName,
          image: formImage || undefined,
          description: formDesc || undefined,
        });
        toast.success("Category updated!");
      } else {
        await createCategory({
          name: formName,
          image: formImage || undefined,
          description: formDesc || undefined,
        });
        toast.success("Category created!");
      }
      setModalOpen(false);
      loadCategories();
    } catch {
      toast.error(editingCat ? "Failed to update category" : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success("Category deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setFormImage(result.url);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>
          Categories
        </h1>
        <button
          onClick={openAdd}
          className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          </svg>
          <p className="text-sm text-gray-400">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Image */}
              <div className="aspect-video bg-gray-50 overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-[#0B1B3A] text-sm">{cat.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{cat.slug}</p>
                <p className="text-xs text-[#F97316] font-medium mt-1">
                  {cat.productsCount ?? 0} product{(cat.productsCount ?? 0) !== 1 ? "s" : ""}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-3 mt-3 border-t border-gray-50">
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium border border-[#0B1B3A] text-[#0B1B3A] rounded-lg hover:bg-[#0B1B3A] hover:text-white transition-colors text-center"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(cat._id)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-center"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-[#0B1B3A]">
                  {editingCat ? "Edit Category" : "Add Category"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Category Name *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                    placeholder="e.g. Televisions"
                  />
                  {formName && (
                    <p className="text-xs text-gray-400 italic mt-1">/products?category={slug}</p>
                  )}
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Image</label>
                  {formImage && (
                    <div className="relative mb-2 rounded-xl overflow-hidden aspect-video bg-gray-50">
                      <img src={formImage} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
                      placeholder="Image URL or upload →"
                    />
                    <label className={`px-4 py-2.5 bg-gray-100 text-[#0B1B3A] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      Upload
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 resize-none"
                    placeholder="Optional description..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation ── */}
      {deletingId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeletingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B1B3A] mb-1">Delete Category?</h3>
              <p className="text-sm text-gray-400 mb-6">
                This cannot be undone if products use this category.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
