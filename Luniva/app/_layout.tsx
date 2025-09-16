import { Stack, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, StyleSheet, Alert, Platform, Linking } from "react-native";
import { theme } from "@/theme/theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as BackgroundTask from "expo-background-task";
import { initializeBackgroundTask } from "@/services/backgroundTask";
import { scheduleDailyNotifications } from "@/services/notificationService";

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Layout() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;
  const [startTime] = useState(Date.now());
  const FORM_URL = "https://forms.gle/yourGoogleFormLink";


  useEffect(() => {
    const interval = setInterval(() => {
      Alert.alert(
        "Enjoying talking to Luniva?",
        "We’d love your feedback! Want to share your thoughts?",
        [
          { text: "Maybe Later", style: "cancel" },
          { text: "Sure!", onPress: () => Linking.openURL(FORM_URL) },
        ]
      );
    }, 10 * 60 * 1000);
  
    return () => clearInterval(interval);
  }, []);
  

  useEffect(() => {
    const setup = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await SplashScreen.hideAsync();

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Please enable notifications in settings.");
        return;
      }
      
      await scheduleDailyNotifications()
      await initializeBackgroundTask();
    };

    setup();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(profile)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
