import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";

import { useColorScheme } from "../components/useColorScheme";
import AppLoadingScreen from "../components/AppLoadingScreen";
import { ThemeProvider } from "../contexts/ThemeContext";
import AppPreloader from "../services/AppPreloader";

export { ErrorBoundary } from "expo-router";

// DO NOT set initialRouteName; let index.tsx decide via Redirect
// Ensure we don't crash if called twice in dev (Fast Refresh / StrictMode)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [preloadingComplete, setPreloadingComplete] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Guard to avoid double-calling hideAsync in dev
  const splashHiddenRef = useRef(false);

  useEffect(() => {
    if (loaded && !splashHiddenRef.current) {
      // Hide native splash exactly once when fonts are ready
      SplashScreen.hideAsync()
        .catch((error) => {
          console.warn("SplashScreen hide error:", error);
        })
        .finally(() => {
          splashHiddenRef.current = true;
        });
      // Mark fonts as loaded in preloader
      const preloader = AppPreloader.getInstance();
      preloader.markFontsLoaded();
    }
  }, [loaded]);

  useEffect(() => {
    // Start preloading when fonts are loaded
    if (loaded) {
      const preloader = AppPreloader.getInstance();

      // Set up completion callback
      preloader.setProgressCallback((progressData) => {
        if (progressData.progress >= 100) {
          // Small delay to ensure smooth transition
          setTimeout(() => {
            setPreloadingComplete(true);
            setShowCustomSplash(false);
          }, 500);
        }
      });

      // Start preloading
      preloader.preloadAll().catch((error) => {
        console.error("Preloading failed:", error);
        // Still proceed even if preloading fails
        setTimeout(() => {
          setPreloadingComplete(true);
          setShowCustomSplash(false);
        }, 500);
      });
    }
  }, [loaded]);

  // Show custom loading screen while fonts load or data preloading
  if (!loaded || showCustomSplash) {
    return <AppLoadingScreen />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider>
      <Stack>
        {/* Core routes */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="targetquestions" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="steps-analytics" options={{ headerShown: false }} />
        <Stack.Screen
          name="steps-performance-chart"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="calories-formula"
          options={{ headerShown: false }}
        />

        {/* Auth + onboarding: hide headers */}
        <Stack.Screen name="authlogin" options={{ headerShown: false }} />
        <Stack.Screen name="authsignup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
