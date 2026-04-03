"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  fetchCustomers,
  fetchCustomerDetail,
  createCustomer,
  updateCustomerRole,
  toggleSuspendCustomer,
  deleteCustomerApi,
} from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import type { Customer, CustomerDetail } from "@/lib/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "orders" | "spent">("newest");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCustomers(page, searchDebounce);
      setCustomers(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setTotalItems(res.totalItems ?? 0);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  useEffect(() => { setPage(1); }, [searchDebounce]);

  const sorted = useMemo(() => {
    const list = [...customers];
    switch (sortBy) {
      case "orders":
        return list.sort((a, b) => b.orderCount - a.orderCount);
      case "spent":
        return list.sort((a, b) => b.totalSpent - a.totalSpent);
      default:
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [customers, sortBy]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleAddUser = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    setSaving(true);
    try {
      await createCustomer({ name: formName, email: formEmail, password: formPassword, phone: formPhone || undefined, role: formRole });
      toast.success("User created!");
      setAddModalOpen(false);
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormPhone(""); setFormRole("user");
      loadCustomers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create user";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateCustomerRole(id, role);
      setCustomers((prev) => prev.map((c) => c._id === id ? { ...c, role } : c));
      toast.success(`Role updated to ${role}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update role";
      toast.error(msg);
    }
  };

  const handleSuspend = async (customer: Customer) => {
    try {
      const res = await toggleSuspendCustomer(customer._id);
      setCustomers((prev) => prev.map((c) => c._id === customer._id ? { ...c, isSuspended: res.isSuspended } : c));
      toast.success(res.isSuspended ? "User suspended" : "User unsuspended");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update";
      toast.error(msg);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailCustomer(null);
    try {
      const detail = await fetchCustomerDetail(id);
      setDetailCustomer(detail);
    } catch {
      toast.error("Failed to load customer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomerApi(deleteId);
      setCustomers((prev) => prev.filter((c) => c._id !== deleteId));
      toast.success("User deleted");
      setDeleteId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete";
      toast.error(msg);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>Customers</h1>
          {!loading && <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full">{totalItems}</span>}
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316]"
          />
        </div>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {([
            { key: "newest", label: "Newest" },
            { key: "orders", label: "Most Orders" },
            { key: "spent", label: "Top Spenders" },
          ] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                sortBy === s.key
                  ? "bg-[#F97316] text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-100 rounded" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sm text-gray-400">{searchDebounce ? "No customers match your search" : "No customers yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Customer</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Phone</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Orders</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Spent</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden lg:table-cell">Joined</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Role</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c._id} onClick={() => openDetail(c._id)} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${c.isSuspended ? "opacity-60" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.isSuspended ? "bg-red-100" : "bg-[#0B1B3A]"}`}>
                          <span className={`text-xs font-bold ${c.isSuspended ? "text-red-500" : "text-white"}`}>{getInitials(c.name)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0B1B3A] flex items-center gap-1.5">
                            {c.name}
                            {c.googleId && (
                              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#0B1B3A]">{c.orderCount}</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-sm font-medium text-[#F97316]">
                      {c.totalSpent > 0 ? formatNaira(c.totalSpent) : "₦0"}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-sm text-gray-400">{formatDate(c.createdAt)}</td>

                    {/* Role */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                          c.role === "admin" ? "bg-orange-50 text-[#F97316]" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {c.isSuspended ? (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">Suspended</span>
                      ) : (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSuspend(c)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            c.isSuspended
                              ? "border-green-300 text-green-600 hover:bg-green-50"
                              : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          }`}
                        >
                          {c.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          onClick={() => { setDeleteId(c._id); setDeleteName(c.name); }}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ── Add User Modal ── */}
      {addModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setAddModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-[#0B1B3A]">Add User</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Full Name *</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Email *</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className={inputClass} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Password *</label>
                  <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className={inputClass} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Phone</label>
                  <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className={inputClass} placeholder="08012345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B1B3A] mb-1.5">Role</label>
                  <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setAddModalOpen(false)} className="px-5 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#0B1B3A] mb-1">Delete User?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-[#0B1B3A]">{deleteName}</span>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Customer Detail Modal ── */}
      {(detailCustomer || detailLoading) && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDetailCustomer(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {detailLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
                </div>
              ) : detailCustomer ? (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${detailCustomer.isSuspended ? "bg-red-100" : "bg-[#0B1B3A]"}`}>
                        <span className={`text-xs font-bold ${detailCustomer.isSuspended ? "text-red-500" : "text-white"}`}>
                          {getInitials(detailCustomer.name)}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-bold text-[#0B1B3A]">{detailCustomer.name}</h2>
                        <p className="text-xs text-gray-400">{detailCustomer.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setDetailCustomer(null)} className="p-1 text-gray-400 hover:text-[#0B1B3A] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Info cards */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#0B1B3A]">{detailCustomer.orderCount}</p>
                        <p className="text-xs text-gray-400 mt-1">Orders</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#F97316]">{formatNaira(detailCustomer.totalSpent)}</p>
                        <p className="text-xs text-gray-400 mt-1">Total Spent</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#0B1B3A]">{formatDate(detailCustomer.createdAt)}</p>
                        <p className="text-xs text-gray-400 mt-1">Joined</p>
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact</h4>
                        <p className="text-sm text-[#0B1B3A]">{detailCustomer.email}</p>
                        <p className="text-sm text-gray-500">{detailCustomer.phone || "No phone"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</h4>
                        <p className="text-sm text-[#0B1B3A] flex items-center gap-1.5">
                          Role: <span className={`font-medium ${detailCustomer.role === "admin" ? "text-[#F97316]" : ""}`}>{detailCustomer.role}</span>
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          Auth: {detailCustomer.googleId ? "Google" : "Email"}
                        </p>
                        {detailCustomer.isSuspended && (
                          <p className="text-sm text-red-500 font-medium mt-1">Suspended</p>
                        )}
                      </div>
                    </div>

                    {/* Saved addresses */}
                    {detailCustomer.savedAddresses && detailCustomer.savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Saved Addresses</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {detailCustomer.savedAddresses.map((addr) => (
                            <div key={addr._id} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-[#F97316] uppercase">{addr.label}</span>
                                {addr.isDefault && <span className="text-[9px] bg-[#F97316] text-white px-1.5 py-0.5 rounded-full">Default</span>}
                              </div>
                              <p className="text-sm font-medium text-[#0B1B3A]">{addr.fullName}</p>
                              <p className="text-xs text-gray-400">{addr.street}, {addr.city}, {addr.state}</p>
                              <p className="text-xs text-gray-400">{addr.phone}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order history */}
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order History</h4>
                    {detailCustomer.orders.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {detailCustomer.orders.map((order) => {
                          const sBadge = { processing: "warning", shipped: "info", delivered: "success", cancelled: "error" }[order.orderStatus] as "warning" | "info" | "success" | "error";
                          const pBadge = { paid: "success", pending: "warning", failed: "error" }[order.paymentStatus] as "success" | "warning" | "error";

                          return (
                            <div key={order._id} className="border border-gray-100 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-[#0B1B3A] font-mono">#{order._id.slice(0, 8)}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={pBadge}>{order.paymentStatus}</Badge>
                                  <Badge variant={sBadge}>{order.orderStatus}</Badge>
                                </div>
                              </div>

                              {/* Items */}
                              <div className="space-y-1.5 mb-3">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    {item.image && (
                                      <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-50" />
                                    )}
                                    <span className="text-gray-600 flex-1 truncate">{item.name}</span>
                                    <span className="text-gray-400">x{item.qty}</span>
                                    <span className="font-medium text-[#0B1B3A]">{formatNaira(item.price * item.qty)}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                                <span className="text-sm font-bold text-[#F97316]">{formatNaira(order.totalAmount)}</span>
                              </div>

                              {/* Shipping */}
                              <div className="mt-2 pt-2 border-t border-gray-50">
                                <p className="text-xs text-gray-400">
                                  Ship to: {order.shippingAddress.fullName} — {order.shippingAddress.city}, {order.shippingAddress.state}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
