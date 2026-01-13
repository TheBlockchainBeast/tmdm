'use client';

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export default function StatsCard({ label, value, change, isPositive }: StatsCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
      <p className="text-[#4c6c9a] dark:text-slate-400 text-[10px] font-bold uppercase">
        {label}
      </p>
      <p className="text-[#0d131b] dark:text-white text-lg font-bold leading-tight">
        {value}
      </p>
      <p className={`text-xs font-bold ${isPositive ? 'text-[#07883b] dark:text-[#3fb950]' : 'text-[#e73908] dark:text-[#f85149]'}`}>
        {change}
      </p>
    </div>
  );
}
