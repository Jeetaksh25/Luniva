import { Text, View, StyleSheet } from "react-native";
import React, { FC } from "react";
import { useModeColor } from "../theme/modeColor";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface InfoTabProps {
  label: string;
  value: any;
  column?: boolean;
}

const InfoTab: FC<InfoTabProps> = ({ label, value, column = false }) => {
  const themeColors = useModeColor();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: darkenColor(themeColors.background, 10),
          flexDirection: column ? "column" : "row",
          alignItems: "flex-start",
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: theme.colors.secondaryColor, marginRight: column ? 0 : 8 },
        ]}
      >
        {label}:
      </Text>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.value,
            {
              color: themeColors.text,
              textAlign: "left",
              flexShrink: 1,
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: theme.colors.secondaryColor,
    borderWidth: 1.5,
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: theme.fontSize.md,
    flexWrap: "wrap",
  },
});

export default InfoTab;
