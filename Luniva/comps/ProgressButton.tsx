import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import { useModeColor } from "../theme/modeColor";
import { Svg, Path, Circle } from "react-native-svg";
import { getChatTrend, renderZigZag } from "@/utils/chatTrend";
import { useStore } from "@/store/useAppStore";

interface ProgressButtonProps {
  onPress: () => void;
  progress: { percentage: number; milestone: number };
}

const ProgressButton: React.FC<ProgressButtonProps> = ({
  onPress,
  progress,
}) => {
  const chats = useStore((state) => state.chats);
  const themeColors = useModeColor();
  const leftWidth = Dimensions.get("window").width * 0.4;

  const todayStr = new Date().toISOString().split("T")[0];
  const trend = getChatTrend(chats, todayStr);
  const path = renderZigZag(trend, leftWidth);

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={["#FF6F61", "#6A4C93"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        {/* Left Section */}
        <View style={[styles.leftSection, { width: leftWidth }]}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>You’re doing your best</Text>

          {/* Simple Zig-Zag Graph */}
          <Svg height="40" width="100%">
            <Path
              d={path}
              stroke={theme.colors.infoColor}
              strokeWidth="3"
              fill="none"
            />
          </Svg>
        </View>

        {/* Right Section (Pie Chart) */}
        <View style={styles.rightSection}>
          <Svg height="80" width="80" viewBox="0 0 100 100">
            {/* Background Circle */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="#ffffff40"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke={theme.colors.successColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray="282.6"
              strokeDashoffset={282.6 * (1 - progress.percentage / 100)}
              strokeLinecap="round"
              rotation="-85"
              origin="50,50" // rotate around center
            />
          </Svg>

          {/* Centered Text */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: "center", alignItems: "center" },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.pieText}>
              {progress.milestone > 0 ? `${progress.percentage}%` : "0%"} (
              {progress.milestone} days)
            </Text>
          </View>
        </View>
        <Text
          style={{
            position: "absolute",
            textAlign: "center",
            bottom: 10,
            color: "white",
          }}
        >
          View Your Journey
        </Text>
      </LinearGradient>
    </Pressable>
  );
};

export default ProgressButton;

const styles = StyleSheet.create({
  container: {
    width: "95%",
    height: 140,
    marginBottom: 40,
    borderRadius: theme.borderRadius.lg,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 15,
    justifyContent: "space-around",
    alignItems: "flex-start",
    alignSelf: "center",
  },
  leftSection: {
    justifyContent: "center",
  },
  rightSection: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "800",
    color: "white",
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: "#ffffffcc",
    marginBottom: 6,
    marginLeft: 4,
  },
  pieText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    maxWidth: "80%",
  },
});
