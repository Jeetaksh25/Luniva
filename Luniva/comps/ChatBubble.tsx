import { View, Text, StyleSheet } from "react-native";
import {theme} from "@/theme/theme";

export default function ChatBubble({ text, role }: { text: string; role: string }) {
  const isAI = role === "ai"
  return (
    <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
      <Text style={{ color: "white"}}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    marginVertical: 5,
    maxWidth: "70%",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: theme.colors.secondaryColor,
    alignSelf: "flex-end",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: theme.colors.primaryColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 20,
  },
});
