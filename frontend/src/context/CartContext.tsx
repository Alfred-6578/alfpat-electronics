"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import type { CartItem, Product } from "@/lib/types";
import { mergeCart as mergeCartAPI, saveDBCart, clearDBCart, fetchDBCart } from "@/lib/client-api";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQty: number) => void;
  clearCart: () => void;
  syncWithDB: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
}

const STORAGE_KEY = "alfpat_cart";
const DEBUG = process.env.NODE_ENV === "development";
const CartContext = createContext<CartContextType | null>(null);

function log(action: string, data?: unknown) {
  if (DEBUG) console.log(`[Cart] ${action}`, data !== undefined ? data : "");
}

function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isLoggedIn() {
  return !!Cookies.get("alfpat_token");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const dbSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoggedIn = useRef(false);

  // Hydrate from localStorage on mount — fetch from DB if logged in with empty local cart
  useEffect(() => {
    const local = readCart();
    const loggedIn = isLoggedIn();
    log("Hydrate", { localCount: local.length, loggedIn });

    if (loggedIn && local.length === 0) {
      // Logged in but empty localStorage — fetch from DB
      log("Fetching cart from DB (localStorage empty, user logged in)");
      mergeCartAPI([])
        .then((dbItems) => {
          log("DB cart fetched on hydrate", { count: dbItems.length, items: dbItems.map((i) => ({ name: i.name, qty: i.qty })) });
          setItems(dbItems);
          writeCart(dbItems);
        })
        .catch((err) => log("DB fetch on hydrate failed", err))
        .finally(() => setHydrated(true));
    } else {
      setItems(local);
      setHydrated(true);
    }

    prevLoggedIn.current = loggedIn;
  }, []);

  // On login: merge local cart with DB cart
  useEffect(() => {
    const handleLogin = async () => {
      const loggedIn = isLoggedIn();
      log("Login event", { loggedIn, prevLoggedIn: prevLoggedIn.current });

      if (loggedIn && !prevLoggedIn.current) {
        const localItems = readCart();
        log("Merging carts", { localCount: localItems.length });

        // Fetch current DB cart before merge for debugging
        try {
          const dbCart = await fetchDBCart();
          log("DB cart BEFORE merge", { count: dbCart.length, items: dbCart.map((i) => ({ name: i.name, qty: i.qty })) });
        } catch (err) {
          log("Failed to fetch DB cart for debug", err);
        }

        try {
          const merged = await mergeCartAPI(localItems);
          log("Merge result", { mergedCount: merged.length, items: merged.map((i) => ({ name: i.name, qty: i.qty })) });
          setItems(merged);
          writeCart(merged);
        } catch (err) {
          log("Merge failed, keeping local", err);
        }
      }

      prevLoggedIn.current = loggedIn;
    };

    window.addEventListener("alfpat_login", handleLogin);
    return () => window.removeEventListener("alfpat_login", handleLogin);
  }, []);

  // Re-sync on navigation / logout
  useEffect(() => {
    const syncCart = () => {
      const local = readCart();
      log("Sync from localStorage (popstate/pageshow)", { count: local.length });
      setItems(local);
    };
    const handleLogout = () => {
      log("Logout — clearing cart state, cancelling DB timer");
      if (dbSyncTimer.current) { clearTimeout(dbSyncTimer.current); dbSyncTimer.current = null; }
      setItems([]);
    };

    window.addEventListener("popstate", syncCart);
    window.addEventListener("pageshow", syncCart);
    window.addEventListener("alfpat_logout", handleLogout);
    return () => {
      window.removeEventListener("popstate", syncCart);
      window.removeEventListener("pageshow", syncCart);
      window.removeEventListener("alfpat_logout", handleLogout);
    };
  }, []);

  // Persist to localStorage + debounced DB save
  useEffect(() => {
    if (!hydrated) return;

    log("Items changed", { count: items.length, loggedIn: isLoggedIn(), items: items.map((i) => ({ name: i.name, qty: i.qty })) });
    writeCart(items);

    // Debounce DB save (only if logged in and cart is not empty)
    if (isLoggedIn() && items.length > 0) {
      if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
      dbSyncTimer.current = setTimeout(() => {
        log("Saving to DB", { count: items.length });
        saveDBCart(items)
          .then(() => log("DB save success"))
          .catch((err) => log("DB save failed", err));
      }, 2000);
    } else {
      log("Skipping DB save", { loggedIn: isLoggedIn(), count: items.length });
    }
  }, [items, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    log("addToCart", { name: product.name, qty: quantity });
    setItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, qty: Math.min(item.qty + quantity, item.stock) }
            : item
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          image: product.images?.[0] ?? "",
          stock: product.stock,
          qty: quantity,
        },
      ];
    });
    toast.success("Added to cart!");
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    log("removeFromCart", { productId });
    setItems((prev) => prev.filter((item) => item._id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, newQty: number) => {
    log("updateQuantity", { productId, newQty });
    if (newQty <= 0) {
      setItems((prev) => prev.filter((item) => item._id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, qty: Math.min(newQty, item.stock) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    log("clearCart", { loggedIn: isLoggedIn() });
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    if (isLoggedIn()) {
      clearDBCart()
        .then(() => log("DB cart cleared"))
        .catch((err) => log("DB cart clear failed", err));
    }
  }, []);

  const syncWithDB = useCallback(async () => {
    log("syncWithDB called");
    const localItems = readCart();
    try {
      const merged = await mergeCartAPI(localItems);
      log("syncWithDB result", { count: merged.length, items: merged.map((i) => ({ name: i.name, qty: i.qty })) });
      setItems(merged);
      writeCart(merged);
    } catch (err) {
      log("syncWithDB failed", err);
    }
  }, []);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.discountPrice ?? item.price) * item.qty,
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncWithDB,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default CartContext;
