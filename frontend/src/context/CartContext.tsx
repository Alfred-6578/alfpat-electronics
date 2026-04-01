"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("alfpat_cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {}
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("alfpat_cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const addToCart = (product, quantity = 1) => {
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
          discountPrice: product.discountPrice || null,
          image: product.images?.[0] || product.image || "",
          stock: product.stock,
          qty: quantity,
        },
      ];
    });
    toast.success("Added to cart!");
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, qty: Math.min(newQty, item.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("alfpat_cart");
  };

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.discountPrice || item.price) * item.qty,
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
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default CartContext;
