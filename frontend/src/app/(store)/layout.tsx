import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-70px)] bg-white">{children}</main>
      <Footer />
    </>
  );
}
