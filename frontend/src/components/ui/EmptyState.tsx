import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
        <span className="text-gray-300">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-[#0B1B3A] mt-4">{title}</h3>
      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">{subtitle}</p>
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-block mt-5 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="mt-5 bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
          >
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
}
