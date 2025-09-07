// Custom hook for managing global refresh functionality across tabs
// Eliminates redundant code and provides consistent refresh behavior

import { useState, useEffect, useCallback } from 'react';
import { globalRefresh } from './GlobalRefresh';

type TabName = 'homepage' | 'meal' | 'fitness' | 'user';

interface UseGlobalRefreshOptions {
  tabName: TabName;
  onInternalRefresh?: () => void | Promise<void>; // Custom refresh logic for each tab
  refreshDuration?: number; // How long the refresh takes
}

export function useGlobalRefresh({ 
  tabName, 
  onInternalRefresh, 
  refreshDuration = 1000 // How long the refresh takes (ms)
}: UseGlobalRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false);

  // Internal refresh function (just refresh this tab's content)
  const internalRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // Execute custom refresh logic if provided
      if (onInternalRefresh) {
        await onInternalRefresh();
      }
    } catch (error) {
      console.warn(`${tabName} refresh error:`, error);
    }
    
    // Wait for refresh duration, then stop refreshing
    setTimeout(() => {
      setRefreshing(false);
    }, refreshDuration);
  }, [refreshing, onInternalRefresh, refreshDuration, tabName]);

  // Manual refresh function (user-triggered, triggers all tabs)
  const handleRefresh = useCallback(() => {
    globalRefresh.triggerAllTabsRefresh();
  }, []);

  // Register internal refresh function for global calls
  useEffect(() => {
    globalRefresh.setTabRefresh(tabName, internalRefresh);
    return () => {
      globalRefresh.clearTabRefresh(tabName);
    };
  }, [tabName, internalRefresh]);

  return {
    refreshing,
    handleRefresh
  };
}
