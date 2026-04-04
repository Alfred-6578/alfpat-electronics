import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT token from cookies to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("alfpat_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response from server)
    if (!error.response) {
      error.message = "Unable to connect to server. Please check your internet and try again.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Auth errors
    if (status === 401) {
      Cookies.remove("alfpat_token");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // Service unavailable — friendly message
    if (status === 503) {
      error.response.data = {
        ...data,
        message: data?.message || "Service temporarily unavailable. Please try again later.",
      };
    }

    // Server error — friendly message
    if (status >= 500 && status !== 503) {
      error.response.data = {
        ...data,
        message: data?.message || "Something went wrong. Please try again later.",
      };
    }

    return Promise.reject(error);
  }
);

export default api;
