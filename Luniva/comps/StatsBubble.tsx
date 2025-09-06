import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import React, { FC } from "react";
import { modeColor } from "../theme/modeColor";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface StatsBubbleProps {
  label: string;
  value: string;
}

const StatsBubble: FC<StatsBubbleProps> = ({ label, value }) => {
  return (
    <TouchableOpacity>
      <View
        style={[
          styles.box,
          { backgroundColor: darkenColor(modeColor().background, 10) },
        ]}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
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
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primaryColor,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primaryColor,
  },
  label: {
    fontSize: theme.fontSize.xs,
    position: "absolute",
    bottom: 2,
  }
});
