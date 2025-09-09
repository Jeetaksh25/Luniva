import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import { useModeColor } from "../theme/modeColor";
import { Svg, Path, Circle } from "react-native-svg";

interface ProgressButtonProps {
  onPress: () => void;
  progress: { percentage: number; milestone: number };
}

const ProgressButton: React.FC<ProgressButtonProps> = ({
  onPress,
  progress,
}) => {
  const themeColors = useModeColor();
  const leftWidth = Dimensions.get("window").width * 0.4; // 60% of screen width

  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={["#FF6F61", "#6A4C93"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        {/* Left Section */}
        <View style={[styles.leftSection, { width: leftWidth }]}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Keep pushing 🚀</Text>

          {/* Simple Zig-Zag Graph */}
          <Svg height="40" width="100%">
            <Path
              d={`M0 30 
                  L${leftWidth * 0.2} 10 
                  L${leftWidth * 0.4} 25 
                  L${leftWidth * 0.6} 15 
                  L${leftWidth * 0.8} 5 
                  L${leftWidth} 20`}
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
              rotation="-90"
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
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ProgressButton;

const styles = StyleSheet.create({
  container: {
    width: "95%",
    height: 120,
    marginBottom: 50,
    borderRadius: theme.borderRadius.lg,
    flexDirection: "row",
    padding: 15,
    justifyContent: "space-around",
    alignItems: "center",
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
    fontSize: theme.fontSize.sm,
    color: "#ffffffcc",
    marginBottom: 6,
  },
  pieText: {
    fontSize:12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    maxWidth: "80%",
  },
});
