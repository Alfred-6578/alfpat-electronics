"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import type { WishlistItem, Product } from "@/lib/types";
import { mergeWishlist as mergeWishlistAPI, saveDBWishlist } from "@/lib/client-api";

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
  wishlistCount: number;
}

const STORAGE_KEY = "alfpat_wishlist";
const WishlistContext = createContext<WishlistContextType | null>(null);

function readWishlist(): WishlistItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeWishlist(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isLoggedIn() {
  return !!Cookies.get("alfpat_token");
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const dbSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoggedIn = useRef(false);

  // Hydrate
  useEffect(() => {
    const local = readWishlist();
    const loggedIn = isLoggedIn();

    if (loggedIn && local.length === 0) {
      mergeWishlistAPI([])
        .then((dbItems) => {
          setItems(dbItems);
          writeWishlist(dbItems);
        })
        .catch(() => {})
        .finally(() => setHydrated(true));
    } else {
      setItems(local);
      setHydrated(true);
    }

    prevLoggedIn.current = loggedIn;
  }, []);

  // Merge on login
  useEffect(() => {
    const handleLogin = async () => {
      const loggedIn = isLoggedIn();
      if (loggedIn && !prevLoggedIn.current) {
        const localItems = readWishlist();
        try {
          const merged = await mergeWishlistAPI(localItems);
          setItems(merged);
          writeWishlist(merged);
        } catch {
          /* keep local */
        }
      }
      prevLoggedIn.current = loggedIn;
    };
    window.addEventListener("alfpat_login", handleLogin);
    return () => window.removeEventListener("alfpat_login", handleLogin);
  }, []);

  // Sync on nav / clear on logout
  useEffect(() => {
    const sync = () => setItems(readWishlist());
    const handleLogout = () => {
      // Cancel pending DB save so empty [] doesn't overwrite saved wishlist
      if (dbSyncTimer.current) { clearTimeout(dbSyncTimer.current); dbSyncTimer.current = null; }
      setItems([]);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("alfpat_logout", handleLogout);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("alfpat_logout", handleLogout);
    };
  }, []);

  // Persist localStorage + debounced DB save
  useEffect(() => {
    if (!hydrated) return;
    writeWishlist(items);
    // Only save to DB when logged in and wishlist is not empty
    if (isLoggedIn() && items.length > 0) {
      if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
      dbSyncTimer.current = setTimeout(() => {
        saveDBWishlist(items).catch(() => {});
      }, 2000);
    }
  }, [items, hydrated]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i._id === product._id)) return prev;
      return [...prev, {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        image: product.images?.[0] ?? "",
        stock: product.stock,
      }];
    });
    toast.success("Added to wishlist");
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i._id !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i._id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (isInWishlist(product._id)) {
        removeFromWishlist(product._id);
        toast.success("Removed from wishlist");
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, clearWishlist, wishlistCount: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}

export default WishlistContext;
