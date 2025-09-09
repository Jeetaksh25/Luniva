import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";

import { useRouter, Redirect } from "expo-router";
import CustomButton from "@/comps/CustomButton";
import { theme } from "@/theme/theme";
import { useState, useRef, useEffect } from "react";
import { useColorScheme } from "react-native";

import * as Haptics from "expo-haptics";

import { useStore } from "@/store/useAppStore";

import { StatusBar } from "expo-status-bar";

export default function FirstScreen() {
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;
  const router = useRouter();

  const { user, initAuth, loadingAuth } = useStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await initAuth();
      setAuthChecked(true);
    };
    
    initializeAuth();
  }, [initAuth]);

  const [currentEmoji, setCurrentEmoji] = useState("😀");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const getRandomEmoji = () =>
    Emojis[Math.floor(Math.random() * Emojis.length)];

  const animateEmojiChange = (onChangeEmoji: any) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onChangeEmoji();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  const Emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "☺️",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🥳",
    "😎",
    "🤓",
    "🤠",
  ];

  const onEmojiPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateEmojiChange(() => setCurrentEmoji(getRandomEmoji()));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      animateEmojiChange(() => setCurrentEmoji(getRandomEmoji()));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    router.push("/signin");
  };

  if (authChecked && user) {
    return <Redirect href="/chat" />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="light" />
        <View style={styles.innerContainer}>
          <Animated.Text
            style={[styles.emoji, { opacity: fadeAnim }]}
            onPress={onEmojiPress}
          >
            {currentEmoji}
          </Animated.Text>
          <Text style={[styles.text, { color: themeColors.primaryText }]}>
            Hey, I'm Luniva
          </Text>
          <Text
            style={{
              color: themeColors.secondaryText,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Your Friend to take care of your mental health and well-being.
          </Text>
          <CustomButton title="Get Started" handlePress={handleGetStarted} isLoading={!authChecked || loadingAuth} loadingText={!authChecked ? "Authenticating" : "Loading"} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.padding.lg,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    gap: theme.gap.lg,
  },
  emoji: {
    fontSize: 100,
  },
  text: {
    fontSize: theme.fontSize["4xl"],
    fontWeight: "600",
  },
});
