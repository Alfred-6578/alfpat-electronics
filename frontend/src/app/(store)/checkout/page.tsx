"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { initializePayment, fetchAddresses, addNewAddress, deleteAddress } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import type { CheckoutFormData, CheckoutFormErrors, SavedAddress } from "@/lib/types";
import { AxiosError } from "axios";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, cartTotal, cartCount } = useCart();
  const router = useRouter();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    note: "",
  });
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch saved addresses
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({ ...prev, email: user.email }));

    fetchAddresses()
      .then((addresses) => {
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          fillForm(defaultAddr);
        } else if (addresses.length > 0) {
          setSelectedAddressId(addresses[0]._id);
          fillForm(addresses[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  const fillForm = (addr: SavedAddress) => {
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
    }));
    setErrors({});
  };

  const handleAddressSelect = (id: string | "new") => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFormData((prev) => ({
        ...prev,
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
      }));
      setErrors({});
    } else {
      const addr = savedAddresses.find((a) => a._id === id);
      if (addr) fillForm(addr);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-xl font-bold text-[#0B1B3A] mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-400 mb-6">Add some products before checking out</p>
        <Link
          href="/products"
          className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: CheckoutFormErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.street.trim()) newErrors.street = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "Please select a state";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Save new address if checkbox is checked
      if (selectedAddressId === "new" && saveNewAddress) {
        try {
          const updated = await addNewAddress({
            label: "Home",
            fullName: formData.fullName,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            isDefault: savedAddresses.length === 0,
          });
          setSavedAddresses(updated);
        } catch {
          // Don't block checkout if save fails
        }
      }

      const result = await initializePayment({
        items: items.map((item) => ({ _id: item._id, qty: item.qty })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
        },
      });
      sessionStorage.setItem("alfpat_payment_ref", result.reference);
      window.location.href = result.paymentUrl;
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast.error(axiosErr.response?.data?.message || "Failed to initialize payment");
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof CheckoutFormErrors) =>
    `w-full px-4 py-3 border rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-[#0B1B3A] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1
            className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Checkout
          </h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-0 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center">1</span>
            <span className="text-sm font-medium text-[#F97316]">Delivery</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-3" />
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-sm font-medium text-gray-400">Payment</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-3" />
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">3</span>
            <span className="text-sm font-medium text-gray-400">Confirmation</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Delivery form ── */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-[#0B1B3A] mb-5">Delivery Information</h2>

            {/* Saved addresses picker */}
            {!loadingAddresses && savedAddresses.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-[#0B1B3A] mb-3">Select a delivery address</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => handleAddressSelect(addr._id)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedAddressId === addr._id
                          ? "border-[#F97316] bg-orange-50/50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(addr._id)
                            .then((updated) => {
                              setSavedAddresses(updated);
                              if (selectedAddressId === addr._id) {
                                const next = updated.find((a) => a.isDefault) || updated[0];
                                if (next) {
                                  setSelectedAddressId(next._id);
                                  fillForm(next);
                                } else {
                                  handleAddressSelect("new");
                                }
                              }
                              toast.success("Address removed");
                            })
                            .catch(() => toast.error("Failed to delete address"));
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="flex items-center justify-between mb-1.5 pr-6">
                        <span className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-medium bg-[#F97316] text-white px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#0B1B3A] truncate">{addr.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{addr.street}, {addr.city}</p>
                      <p className="text-xs text-gray-400">{addr.state} · {addr.phone}</p>
                    </div>
                  ))}

                  {/* Add new address card */}
                  <button
                    type="button"
                    onClick={() => handleAddressSelect("new")}
                    className={`text-left p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center min-h-[120px] ${
                      selectedAddressId === "new"
                        ? "border-[#F97316] bg-orange-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500">New Address</span>
                  </button>
                </div>
              </div>
            )}

            {loadingAddresses && (
              <div className="mb-6 grid sm:grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[120px] rounded-xl border border-gray-200 animate-pulse bg-gray-50" />
                ))}
              </div>
            )}

            {/* Form fields — always visible for editing or new entry */}
            <div className={`grid sm:grid-cols-2 gap-4 ${
              selectedAddressId !== "new" && savedAddresses.length > 0
                ? "opacity-60 pointer-events-none"
                : ""
            }`}>
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className={inputClass("fullName")}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={inputClass("phone")}
                  placeholder="08012345678"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                {!errors.phone && <p className="text-xs text-gray-400 mt-1">We&apos;ll call this number for delivery</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  readOnly
                  value={formData.email}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50 outline-none cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Order confirmation will be sent here</p>
              </div>

              {/* Street */}
              <div className="sm:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  Street Address
                </label>
                <input
                  id="street"
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className={inputClass("street")}
                  placeholder="15 Allen Avenue"
                />
                {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass("city")}
                  placeholder="Ikeja"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                  State
                </label>
                <select
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={`${inputClass("state")} cursor-pointer ${!formData.state ? "text-gray-400" : ""}`}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>
            </div>

            {/* Save address checkbox — only for new addresses */}
            {selectedAddressId === "new" && (
              <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316]"
                />
                <span className="text-sm text-gray-500">Save this address for future orders</span>
              </label>
            )}

            {/* Edit selected address link */}
            {selectedAddressId !== "new" && savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => handleAddressSelect("new")}
                className="mt-4 text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Use a different address
              </button>
            )}

            {/* Note — always visible */}
            <div className="mt-6">
              <label htmlFor="note" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                Order Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="note"
                rows={3}
                value={formData.note}
                onChange={(e) => updateField("note", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                placeholder="Any special instructions for delivery?"
              />
            </div>
          </div>

          {/* ── Right: Order summary ── */}
          <div>
            <div className="bg-[#FAFAFA] rounded-2xl p-6 sticky top-28">
              <h2 className="text-lg font-bold text-[#0B1B3A] mb-4">Order Summary</h2>

              <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gray-400">{item.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0B1B3A] truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#0B1B3A] shrink-0">
                      {formatNaira((item.discountPrice ?? item.price) * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-[#0B1B3A]">{formatNaira(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery</span>
                  <span className="font-medium text-[#F97316]">To be confirmed</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-[#0B1B3A]">Total</span>
                  <span className="text-xl font-bold text-[#0B1B3A]">{formatNaira(cartTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Pay ${formatNaira(cartTotal)} with Paystack 🔒`
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secured by Paystack
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
