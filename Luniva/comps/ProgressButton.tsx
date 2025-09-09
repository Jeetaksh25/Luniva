import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { theme } from "../theme/theme";
import { useModeColor } from "../theme/modeColor";


interface ProgressButtonProps {
  onPress: () => void;
}

const ProgressButton: FC<ProgressButtonProps> = ({ onPress }) => {
  const themeColors = useModeColor();
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={["#FF6F61", "#6A4C93"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <Text style={styles.progressText}>Progress</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ProgressButton;

const styles = StyleSheet.create({
  container: {
    width: "95%",
    height: 100,
    marginVertical: 20,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.secondaryColor,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    padding: 4,
  },
  progressText: {
    fontSize: theme.fontSize.lg,
    color: "white",
    fontWeight: "800",
  },
});
