import { Text, View, StyleSheet } from "react-native";
import React, { FC } from "react";
import { modeColor } from "../theme/modeColor";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface InfoTabProps {
  label: string;
  value: any;
  column?: boolean; 
}

const InfoTab: FC<InfoTabProps> = ({ label, value, column = false }) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: darkenColor(modeColor().background, 10),
          flexDirection: column ? "column" : "row",
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.secondaryColor }]}>
        {label}:
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: modeColor().text,
            textAlign: column ? "left" : "right",
            marginTop: column ? 4 : 0,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

export default InfoTab;

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
    paddingHorizontal: 4,
    paddingLeft: 10,
  },
});
