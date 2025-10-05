import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { useColorScheme } from "../components/useColorScheme";
import AppLoadingScreen from "../components/AppLoadingScreen";

export { ErrorBoundary } from "expo-router";

// DO NOT set initialRouteName; let index.tsx decide via Redirect
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Show custom loading screen for full progress bar duration
      setTimeout(() => {
        setShowCustomSplash(false);
      }, 7000); // 7 seconds to match progress bar
    }
  }, [loaded]);

  // Show custom loading screen while fonts load or during minimum display time
  if (!loaded || showCustomSplash) {
    return <AppLoadingScreen />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
    <Stack>
      {/* Core routes */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="targetquestions" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="steps-analytics" options={{ headerShown: false }} />

      {/* Auth + onboarding: hide headers */}
      <Stack.Screen name="authlogin" options={{ headerShown: false }} />
      <Stack.Screen name="authsignup" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
