'use client';

import { useState, useEffect } from 'react';

interface ErrorStateProps {
  error: string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
}

export default function ErrorState({
  error,
  onRetry,
  title,
  description,
  showRetry = true,
}: ErrorStateProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine if it's a network error
  const isNetworkError = !isOnline || 
    error?.toLowerCase().includes('failed to fetch') ||
    error?.toLowerCase().includes('network') ||
    error?.toLowerCase().includes('connection');

  const getErrorIcon = () => {
    if (isNetworkError) {
      return 'wifi_off';
    }
    return 'error';
  };

  const getErrorTitle = () => {
    if (title) return title;
    if (isNetworkError) {
      return 'No Internet Connection';
    }
    return 'Something Went Wrong';
  };

  const getErrorDescription = () => {
    if (description) return description;
    if (isNetworkError) {
      return 'Please check your internet connection and try again.';
    }
    return error || 'An unexpected error occurred. Please try again.';
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-6">
        <span className={`material-symbols-outlined text-red-500 text-5xl ${isNetworkError ? 'animate-pulse' : ''}`}>
          {getErrorIcon()}
        </span>
      </div>
      <h2 className="text-[#0d131b] dark:text-white text-xl font-bold mb-2 text-center">
        {getErrorTitle()}
      </h2>
      <p className="text-[#4c6c9a] dark:text-slate-400 text-sm text-center mb-6 max-w-sm">
        {getErrorDescription()}
      </p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-600 transition-colors active:scale-95"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </span>
        </button>
      )}
      {isNetworkError && (
        <p className="text-[#4c6c9a] dark:text-slate-400 text-xs text-center mt-4">
          Waiting for connection...
        </p>
      )}
    </div>
  );
}
