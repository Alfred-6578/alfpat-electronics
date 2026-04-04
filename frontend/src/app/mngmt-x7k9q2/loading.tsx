export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div>
        <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-4 text-center">Loading...</p>
      </div>
    </div>
  );
}
