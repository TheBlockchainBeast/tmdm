export default function TokenDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Header Section */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex-1">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-6 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Sentiment Section */}
      <div className="px-4 mb-6">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
          <div className="flex gap-4">
            <div className="flex-1 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            <div className="flex-1 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-4 mb-6">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="flex gap-2">
              {['1D', '7D', '1M'].map((label) => (
                <div key={label} className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
          <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>

      {/* Social Links */}
      <div className="px-4 mb-6">
        <div className="flex gap-4 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
