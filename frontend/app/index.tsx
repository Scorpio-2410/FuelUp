import React from "react";
import { Redirect } from "expo-router";
import AppPreloader from "../services/AppPreloader";

type Dest = "/(tabs)/homepage" | "/authlogin";

export default function Index() {
  // Get preloaded auth data (already checked during loading screen)
  // No need for async - data is already loaded!
  const preloader = AppPreloader.getInstance();
  const preloadedData = preloader.getPreloadedData();
  
  // Use preloaded auth status to determine destination
  const dest: Dest = preloadedData.isAuthenticated ? "/(tabs)/homepage" : "/authlogin";
  
  // Instant redirect - no white screen!
  return <Redirect href={dest as any} />;
}
