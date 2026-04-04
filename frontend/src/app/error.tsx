"use client";

import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Warning icon */}
        <svg
          className="w-16 h-16 text-red-400 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>

        <h1
          className="text-2xl font-bold text-[#0B1B3A] mt-4"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          An unexpected error occurred. Don&apos;t worry — it&apos;s not your fault.
        </p>

        {/* Error details (dev only) */}
        {isDev && error?.message && (
          <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left max-w-sm mx-auto">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
              Error details:
            </p>
            <p className="text-xs font-mono text-gray-600 mt-1 break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#0B1B3A] font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
