import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from "react-native";
import { useModeColor } from "@/theme/modeColor";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import CustomButton from "./CustomButton";

interface EmptyChatProps {
    onStartChat: () => void;
}

const EmptyChat: React.FC<EmptyChatProps> = ({ onStartChat }) => {
  const themeColors = useModeColor();

  // Floating animation for emoji/friend illustration
  const floatAnim = useRef(new Animated.Value(0)).current;

  const currentEmoji = "😀";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const startChat = () => {
    Haptics.selectionAsync();
    onStartChat();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
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
        I’m here to listen, guide, and cheer you up. Your thoughts are safe with
        me.
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
  friendImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
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
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
});

export default EmptyChat;
