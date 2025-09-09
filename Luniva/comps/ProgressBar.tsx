import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

const ProgressBar = () => {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[darkenColor(theme.colors.successColor,100), theme.colors.successColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fill}
      />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  wrapper: {
    width: "90%",
    height: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
    alignSelf: "center",
    marginVertical: 20,
  },
  fill: {
    width: "40%",
    height: "100%",
  },
});
