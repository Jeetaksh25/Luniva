import { View, Text, StyleSheet } from "react-native";

export default function ChatBubble({ text, sender }: { text: string; sender: string }) {
  const isUser = sender === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={{ color: isUser ? "white" : "black" }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: "70%",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#eee",
  },
});
