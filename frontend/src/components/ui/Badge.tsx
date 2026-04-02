import type { ReactNode } from "react";

const variants = {
  success: "bg-green-50 text-green-700 ring-1 ring-green-200",
  warning: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  error: "bg-red-50 text-red-700 ring-1 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  default: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
} as const;

type VariantKey = keyof typeof variants;

interface BadgeProps {
  children: ReactNode;
  variant?: VariantKey;
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variants[variant]
      }`}
    >
      {children}
    </span>
  );
}
