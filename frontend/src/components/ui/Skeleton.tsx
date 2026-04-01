export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square bg-gray-200" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title lines */}
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />

        {/* Price */}
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded-full w-full mt-3" />
      </div>
    </div>
  );
}
