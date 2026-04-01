import { Outfit, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "ALFPAT ELECTRONICS — Quality Home Electronics",
  description:
    "Shop the best TVs, Washing Machines, Refrigerators, Fans and more in Nigeria",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className={`${outfit.className} min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                success: {
                  duration: 3000,
                  style: { background: "#10B981", color: "#fff" },
                },
                error: {
                  duration: 4000,
                  style: { background: "#EF4444", color: "#fff" },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
