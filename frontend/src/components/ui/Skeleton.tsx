export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg animate-pulse">
      {/* Image area */}
      <div className="relative p-3 pb-2">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-200" />
        <div className="h-60 rounded-lg bg-gray-200" />
      </div>

      {/* Info area */}
      <div className="px-4 py-3.5 pt-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3 mt-2" />

        <div className="flex items-end justify-between mt-2">
          <div className="space-y-1">
            <div className="h-3 bg-gray-100 rounded w-14" />
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>
        </div>

        {/* Full-width button */}
        <div className="h-9 bg-gray-200 rounded-full w-full mt-3" />
      </div>
    </div>
  );
}
