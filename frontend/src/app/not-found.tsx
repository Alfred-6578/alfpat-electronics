import Link from "next/link";

const WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-4">
        {/* 404 */}
        <p className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
          404
        </p>

        <h1
          className="text-2xl font-bold text-[#0B1B3A] mt-4"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Page Not Found
        </h1>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Illustration */}
        <svg className="w-48 h-48 mx-auto mt-6 mb-8" viewBox="0 0 200 200" fill="none">
          {/* Box */}
          <rect x="50" y="60" width="100" height="80" rx="8" stroke="#D1D5DB" strokeWidth="3" strokeDasharray="8 6" />
          <path d="M50 80h100" stroke="#D1D5DB" strokeWidth="3" strokeDasharray="8 6" />
          {/* Question mark */}
          <text x="100" y="128" textAnchor="middle" fontSize="36" fontWeight="bold" fill="#E5E7EB">?</text>
          {/* Broken link pieces */}
          <circle cx="40" cy="50" r="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
          <circle cx="160" cy="50" r="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" />
          <path d="M46 50h20M134 50h20" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          {/* Sparkles */}
          <circle cx="35" cy="155" r="3" fill="#FED7AA" />
          <circle cx="170" cy="145" r="2" fill="#FED7AA" />
          <circle cx="155" cy="165" r="4" fill="#FDBA74" />
        </svg>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/products"
            className="border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Browse Products
          </Link>
        </div>

        {/* Contact */}
        {WHATSAPP && (
          <p className="text-xs text-gray-400 mt-8">
            Lost? Contact us on{" "}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] font-medium hover:underline"
            >
              WhatsApp
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
