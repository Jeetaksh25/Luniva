import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/theme/theme";

interface SummaryCardProps {
  chats?: any[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ chats = [] }) => {
  return (
    <LinearGradient colors={["#6A4C93", "#FF6F61"]} style={styles.card}>
      <Text style={styles.title}>Weekly Summary</Text>
      <Text style={styles.placeholderText}>
        {chats.length > 0
          ? "Placeholder summary for your chats"
          : "No chats yet"}
      </Text>
    </LinearGradient>
  );
};

export default SummaryCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: "center",
    marginVertical: 10,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: "white",
    marginBottom: 10,
  },
  placeholderText: {
    color: "white",
    fontSize: theme.fontSize.sm,
    textAlign: "center",
  },
});
