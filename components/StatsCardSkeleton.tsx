export default function StatsCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm min-w-0 animate-pulse">
      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  );
}
