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
import ChatBubble from "@/comps/ChatBubble";
import SidebarCalendar from "@/comps/SidebarCalendar";

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
  const flatListRef = useRef<FlatList>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

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
            onPress={() => setSidebarVisible(true)}
          />
          <SidebarCalendar
            visible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
          />
          <Animated.View style={[styles.emojiContainer, { opacity: fadeAnim }]}>
            <Text style={styles.emoji}>{currentEmoji}</Text>
          </Animated.View>

          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatBubble
                  text={item.text}
                  role={item.sender === "me" ? "user" : "ai"}
                />
              )}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
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
    paddingHorizontal: 20,
    paddingVertical: 5,
    flexGrow: 1,
  },
  emoji: { fontSize: 80 },
  menuIcon: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
  },
});

export default Chat;
