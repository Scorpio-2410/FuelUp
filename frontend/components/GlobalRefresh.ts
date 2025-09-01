// Global refresh manager for cross-tab component updates
// Allows any tab to trigger ALL app components to refresh

type RefreshCallback = () => void;

interface TabCallbacks {
  homepage?: RefreshCallback;
  meal?: RefreshCallback;
  fitness?: RefreshCallback;
  user?: RefreshCallback;
}

class GlobalRefreshManager {
  private tabCallbacks: TabCallbacks = {};
  private isRefreshing = false; // Prevent circular refresh calls

  // Register refresh function for any tab (internal refresh only, no global trigger)
  setTabRefresh(tabName: keyof TabCallbacks, callback: RefreshCallback) {
    this.tabCallbacks[tabName] = callback;
  }

  // Trigger ALL tabs to refresh from anywhere (with circular protection)
  triggerAllTabsRefresh() {
    if (this.isRefreshing) return; // Prevent circular calls
    
    this.isRefreshing = true;
    
    // Call each tab's internal refresh function directly
    Object.values(this.tabCallbacks).forEach(callback => {
      if (callback) {
        callback();
      }
    });
    
    // Reset after a short delay to allow refresh completion
    setTimeout(() => {
      this.isRefreshing = false;
    }, 3000); // Longer delay to account for all tab refresh timings
  }

  // Clear specific tab callback (cleanup)
  clearTabRefresh(tabName: keyof TabCallbacks) {
    delete this.tabCallbacks[tabName];
  }

  // Clear all callbacks (cleanup)
  clearAllCallbacks() {
    this.tabCallbacks = {};
  }
}

// Export singleton instance
export const globalRefresh = new GlobalRefreshManager();
