'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/lib/firebase-watchlist';

interface AlertItem {
  address: string;
  symbol: string;
  name: string;
  priceAlert: boolean;
  sentimentAlert: boolean;
}

interface ManageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onUpdate: () => void;
}

export default function ManageAlertsModal({
  isOpen,
  onClose,
  alerts,
  onUpdate,
}: ManageAlertsModalProps) {
  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>(alerts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  if (!isOpen) return null;

  const handleToggle = async (address: string, type: 'price' | 'sentiment') => {
    const userId = getUserId();
    const alert = localAlerts.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (!alert) return;

    const current = type === 'price' ? alert.priceAlert : alert.sentimentAlert;
    const newValue = !current;

    try {
      setLoading(true);
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: address,
          type,
          enabled: newValue,
          userId,
        }),
      });

      if (response.ok) {
        setLocalAlerts(prev =>
          prev.map(a =>
            a.address.toLowerCase() === address.toLowerCase()
              ? {
                  ...a,
                  [type === 'price' ? 'priceAlert' : 'sentimentAlert']: newValue,
                }
              : a
          )
        );
        onUpdate();
      }
    } catch (error) {
      // Error updating alert
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAll = async (type: 'price' | 'sentiment') => {
    const userId = getUserId();
    setLoading(true);

    try {
      await Promise.all(
        localAlerts.map(alert => {
          const current = type === 'price' ? alert.priceAlert : alert.sentimentAlert;
          if (!current) {
            return fetch('/api/alerts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tokenAddress: alert.address,
                type,
                enabled: true,
                userId,
              }),
            });
          }
          return Promise.resolve();
        })
      );

      setLocalAlerts(prev =>
        prev.map(a => ({
          ...a,
          [type === 'price' ? 'priceAlert' : 'sentimentAlert']: true,
        }))
      );
      onUpdate();
    } catch (error) {
      console.error('Error enabling all alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAll = async (type: 'price' | 'sentiment') => {
    const userId = getUserId();
    setLoading(true);

    try {
      await Promise.all(
        localAlerts.map(alert => {
          const current = type === 'price' ? alert.priceAlert : alert.sentimentAlert;
          if (current) {
            return fetch('/api/alerts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tokenAddress: alert.address,
                type,
                enabled: false,
                userId,
              }),
            });
          }
          return Promise.resolve();
        })
      );

      setLocalAlerts(prev =>
        prev.map(a => ({
          ...a,
          [type === 'price' ? 'priceAlert' : 'sentimentAlert']: false,
        }))
      );
      onUpdate();
    } catch (error) {
      // Error disabling all alerts
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-background-dark rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-[#0d131b] dark:text-white text-lg font-bold">
            Manage Alerts
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0d131b] dark:text-white">
              Price Alerts
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleEnableAll('price')}
                disabled={loading}
                className="px-3 py-1 text-xs font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
              >
                Enable All
              </button>
              <button
                onClick={() => handleDisableAll('price')}
                disabled={loading}
                className="px-3 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-[#0d131b] dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Disable All
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0d131b] dark:text-white">
              Sentiment Alerts
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleEnableAll('sentiment')}
                disabled={loading}
                className="px-3 py-1 text-xs font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50"
              >
                Enable All
              </button>
              <button
                onClick={() => handleDisableAll('sentiment')}
                disabled={loading}
                className="px-3 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-[#0d131b] dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                Disable All
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto">
          {localAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2">
                notifications_off
              </span>
              <p className="text-[#4c6c9a] dark:text-slate-400 text-sm">No alerts configured</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {localAlerts.map((alert) => (
                <div key={alert.address} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[#0d131b] dark:text-white text-sm font-bold">
                        {alert.symbol}
                      </p>
                      {alert.name && (
                        <p className="text-[#4c6c9a] dark:text-slate-400 text-xs">
                          {alert.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#4c6c9a] dark:text-slate-400">Price</span>
                      <button
                        onClick={() => handleToggle(alert.address, 'price')}
                        disabled={loading}
                        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                          alert.priceAlert
                            ? 'text-primary bg-primary/10'
                            : 'text-slate-300 dark:text-slate-700'
                        } disabled:opacity-50`}
                      >
                        <span className={`material-symbols-outlined !text-[18px] ${alert.priceAlert ? 'fill-icon' : ''}`}>
                          {alert.priceAlert ? 'notifications_active' : 'notifications'}
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#4c6c9a] dark:text-slate-400">Sentiment</span>
                      <button
                        onClick={() => handleToggle(alert.address, 'sentiment')}
                        disabled={loading}
                        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                          alert.sentimentAlert
                            ? 'text-primary bg-primary/10'
                            : 'text-slate-300 dark:text-slate-700'
                        } disabled:opacity-50`}
                      >
                        <span className={`material-symbols-outlined !text-[18px] ${alert.sentimentAlert ? 'fill-icon' : ''}`}>
                          psychology
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
