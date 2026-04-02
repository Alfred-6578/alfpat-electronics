"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get("alfpat_token");
      if (token) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch {
          Cookies.remove("alfpat_token");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post("/auth/login", { email, password });
    Cookies.set("alfpat_token", data.token, { expires: 7 });
    setUser(data);
    return data;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    const { data } = await api.post("/auth/register", { name, email, password });
    Cookies.set("alfpat_token", data.token, { expires: 7 });
    setUser(data);
    return data;
  };

  const loginWithGoogle = () => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace("/api", "");
    window.location.href = base + "/api/auth/google";
  };

  const logout = () => {
    Cookies.remove("alfpat_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
