export default function WatchlistRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/30 px-4 py-4 animate-pulse">
      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="flex items-center gap-1">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="flex items-center gap-1.5 ml-2">
        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
      </div>
    </div>
  );
}
