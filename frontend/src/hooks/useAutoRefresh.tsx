import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  refreshFunction: () => Promise<void> | void;
  interval?: number; // milliseconds
  enabled?: boolean;
  dependencies?: any[];
}

export const useAutoRefresh = ({ 
  refreshFunction, 
  interval = 60000, // 1 minute default
  enabled = true,
  dependencies = []
}: UseAutoRefreshOptions) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(async () => {
      try {
        await refreshFunction();
        lastRefreshRef.current = Date.now();
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, ...dependencies]);

  const manualRefresh = async () => {
    try {
      await refreshFunction();
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
  };

  return {
    manualRefresh,
    lastRefresh: lastRefreshRef.current
  };
};