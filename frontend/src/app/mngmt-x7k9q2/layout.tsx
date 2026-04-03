"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/layout/AdminSidebar";

const ADMIN_BASE = "/mngmt-x7k9q2";

const pageTitles: Record<string, string> = {
  [ADMIN_BASE]: "Dashboard",
  [`${ADMIN_BASE}/orders`]: "Orders",
  [`${ADMIN_BASE}/products`]: "Products",
  [`${ADMIN_BASE}/categories`]: "Categories",
  [`${ADMIN_BASE}/customers`]: "Customers",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?redirect=${ADMIN_BASE}`);
      return;
    }
    if (user.role !== "admin") {
      toast.error("Access denied");
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const pageTitle =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    pageTitles[ADMIN_BASE] ||
    "Admin";

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 text-gray-500 hover:text-[#0B1B3A] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h1 className="text-lg font-bold text-[#0B1B3A]">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Bell */}
              <button className="p-1.5 text-gray-400 hover:text-[#F97316] transition-colors relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 hidden sm:block" />

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0B1B3A] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#0B1B3A] leading-none">{user.name}</p>
                  <span className="text-[10px] font-medium text-[#F97316] bg-orange-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                    Admin
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="hidden sm:block text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
