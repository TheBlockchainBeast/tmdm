export default function MarketRowSkeleton() {
  return (
    <div className="px-4 py-4 flex items-center border-b border-slate-50 dark:border-slate-800 animate-pulse">
      <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="flex-1 flex items-center gap-3">
        <div className="w-8 h-8 dark:w-9 dark:h-9 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex-1">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
      <div className="w-24 flex flex-col items-center gap-1">
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex justify-between w-full">
          <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
      <div className="w-20 flex flex-col items-end gap-2">
        <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
      </div>
    </div>
  );
}
