'use client';

interface AlertHistoryRowProps {
  tokenSymbol: string;
  tokenName?: string;
  type: 'price' | 'sentiment';
  action: 'enabled' | 'disabled';
  timestamp: Date;
}

export default function AlertHistoryRow({
  tokenSymbol,
  tokenName,
  type,
  action,
  timestamp,
}: AlertHistoryRowProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeLabel = () => {
    return type === 'price' ? 'Price Alert' : 'Sentiment Alert';
  };

  const getActionIcon = () => {
    return action === 'enabled' ? 'notifications_active' : 'notifications_off';
  };

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/30 px-4 py-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
        <span className="material-symbols-outlined text-primary text-xl">
          {getActionIcon()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[#0d131b] dark:text-white text-sm font-bold truncate">
            {tokenSymbol}
          </p>
          {tokenName && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
              {tokenName}
            </span>
          )}
        </div>
        <p className="text-[#4c6c9a] dark:text-slate-400 text-xs mt-0.5">
          {getTypeLabel()} {action === 'enabled' ? 'enabled' : 'disabled'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[#4c6c9a] dark:text-slate-400 text-xs font-medium">
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
