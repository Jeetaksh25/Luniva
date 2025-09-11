import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import CustomButton from "./CustomButton";
import { useModeColor } from "@/theme/modeColor";

interface EmptyChatProps {
  onStartChat: () => void;
}

const EmptyChat: React.FC<EmptyChatProps> = ({ onStartChat }) => {
  const themeColors = useModeColor();

  // Shared value for floating animation
  const float = useSharedValue(0);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  useEffect(() => {
    // Looping floating animation
    float.value = withRepeat(
      withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // reverse each time
    );
  }, []);

  const currentEmoji = "😀";

  const startChat = () => {
    Haptics.selectionAsync();
    onStartChat();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Animated.View style={animatedStyle}>
        <Text
          style={styles.emoji}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          {currentEmoji}
        </Text>
      </Animated.View>

      <Text style={[styles.title, { color: themeColors.text }]}>
        Hi there! I’m Luniva 🌙
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>
        I’m here to listen, guide, and cheer you up. Your thoughts are safe with me.
      </Text>

      <CustomButton title="Start Chatting" handlePress={startChat} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
});

export default EmptyChat;
