export default function PortfolioSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Balance Section */}
      <section className="flex flex-col items-center pt-6 pb-2 px-4">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-100 dark:bg-[#1c2633] border border-slate-200 dark:border-gray-800">
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-100 dark:bg-[#1c2633] border border-slate-200 dark:border-gray-800">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>

      {/* Asset Distribution */}
      <div className="px-4 py-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-3"></div>
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-800/40">
          <div className="col-span-4 h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="col-span-4 h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
          <div className="col-span-4 h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
        </div>

        {/* Holdings List Skeleton */}
        <div className="divide-y divide-slate-100 dark:divide-gray-800">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex-1">
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
              <div className="col-span-4 text-right">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto mb-1"></div>
                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
              </div>
              <div className="col-span-4 text-right">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto mb-1"></div>
                <div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
