import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
} from "react-native";
import MessageInput from "@/comps/MessageInput";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import { Emojis } from "@/utils/emojis";
import Feather from "@expo/vector-icons/Feather";

const Chat = () => {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hey, how are you?", sender: "other" },
    { id: "2", text: "I’m good! You?", sender: "me" },
  ]);
  const [input, setInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const [currentEmoji, setCurrentEmoji] = useState("😀");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateEmojiChange = (onChangeEmoji: any) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onChangeEmoji();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        enabled={keyboardVisible}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}
        >
          <Feather
            name="menu"
            size={theme.fontSize["3xl"]}
            color={themeColors.text}
            style={styles.menuIcon}
          />

          <Animated.View style={[styles.emojiContainer, { opacity: fadeAnim }]}>
            <Text style={styles.emoji}>{currentEmoji}</Text>
          </Animated.View>

          <View style={{ flex: 1,paddingHorizontal: 10}}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.message,
                    item.sender === "me"
                      ? styles.myMessage
                      : styles.otherMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
            />
          </View>

          <MessageInput
            placeholder="Type a message"
            onSend={(message) => {
              if (message.trim().length === 0) return;
              setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), text: message, sender: "me" },
              ]);
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  emojiContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  message: {
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "70%",
  },
  myMessage: {
    backgroundColor: "#6A4C93",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#FF6F61",
    alignSelf: "flex-start",
  },
  messageText: { color: "white", fontSize: 16 },
  emoji: { fontSize: 80 },
  menuIcon: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
  },
});

export default Chat;
