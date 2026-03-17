import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
  View,
} from "react-native";
import "react-native-reanimated";

import { ApiErrorBanner } from "@/components/api-error-banner";
import { OfflineBanner } from "@/components/offline-banner";
import { Colors } from "@/constants/theme";
import { ApiErrorProvider } from "@/contexts/api-error-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { NetworkProvider } from "@/contexts/network-context";
import {
  initNotificationHandler,
  onAppOpened,
  requestNotificationPermissions,
} from "@/lib/notifications";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (!isAuthenticated) return;
    initNotificationHandler();
    requestNotificationPermissions().then(() => onAppOpened());
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        initNotificationHandler();
        onAppOpened();
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <>
      <View style={{ paddingTop: insets.top }}>
        <OfflineBanner />
        <ApiErrorBanner />
      </View>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() { 
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <NetworkProvider>
          <ApiErrorProvider>
            <AuthProvider>
              <RootLayoutNav />
              <StatusBar style={Platform.OS === "android" ? "auto" : "auto"} />
            </AuthProvider>
          </ApiErrorProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
