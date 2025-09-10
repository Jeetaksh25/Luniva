import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import React, { FC } from "react";
import { useModeColor } from "@/theme/modeColor";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface StatsBubbleProps {
  label: string;
  value: string;
}

const StatsBubble: FC<StatsBubbleProps> = ({ label, value }) => {
  const themeColors = useModeColor();
  return (
    <TouchableOpacity>
      <View
        style={[
          styles.box,
          { backgroundColor: darkenColor(themeColors.background, 10) },
        ]}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default StatsBubble;

const styles = StyleSheet.create({
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 3,
    borderColor: theme.colors.primaryColor,
    gap: 4,
  },
  value: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: "700",
    color: theme.colors.primaryColor,
  },
  label: {
    fontSize: 10,
    position: "absolute",
    bottom: 5,
  },
});
