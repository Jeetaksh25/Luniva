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
import { useStore } from "@/store/useAppStore";
import { useRouter, Redirect } from "expo-router";

const Chat = () => {
  const [input, setInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const [currentEmoji, setCurrentEmoji] = useState("😀");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const { messages, sendMessage, loadMessages, currentChatId, chats, user } =
    useStore();
  const [isTodayChat, setIsTodayChat] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = useStore.getState();
      if (!user) {
        console.log("No user found, redirecting to signin");
        router.replace('/signin');
        return;
      }
      
    };
  
    checkAuth();
  }, []);

  if (!user) {
    return <Redirect href="/signin" />;
  }

  // In your Chat component
useEffect(() => {
  const { user } = useStore.getState();
  if (!user) {
    console.error("No authenticated user");
    return;
  }
  
  const createChatIfNeeded = async () => {
    if (!currentChatId) {
      setIsCreatingChat(true);
      try {
        await useStore.getState().createTodayChat();
        console.log("Today's chat created successfully");
      } catch (error) {
        console.error("Failed to create chat:", error);
      } finally {
        setIsCreatingChat(false);
      }
    }
  };

  createChatIfNeeded();
}, []);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentChat = chats.find((chat: { chatId: string; date: string }) => chat.chatId === currentChatId);
    setIsTodayChat(currentChat?.date === todayStr);
  }, [currentChatId, chats]);

  useEffect(() => {
    // Create today's chat if it doesn't exist
    const createChatIfNeeded = async () => {
      if (!currentChatId) {
        setIsCreatingChat(true);
        try {
          await useStore.getState().createTodayChat();
          console.log("Today's chat created successfully");
        } catch (error) {
          console.error("Failed to create chat:", error);
        } finally {
          setIsCreatingChat(false);
        }
      }
    };

    createChatIfNeeded();
  }, []);

  useEffect(() => {
    if (!currentChatId) {
      console.log("No current chat ID, skipping message loading");
      return;
    }

    console.log("Loading messages for chat:", currentChatId);
    const unsubscribe = loadMessages(currentChatId);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentChatId, loadMessages]);

  const handleSendMessage = async (messageText: string) => {
    if (messageText.trim().length === 0) return;

    if (!currentChatId) {
      console.log("No chat ID available, creating chat first...");
      setIsCreatingChat(true);
      try {
        await useStore.getState().createTodayChat();
        // Now send the message
        sendMessage(messageText);
      } catch (error) {
        console.error("Failed to create chat:", error);
      } finally {
        setIsCreatingChat(false);
      }
    } else {
      sendMessage(messageText);
    }
  };

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
            {messages.length === 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 50,
                  color: themeColors.text,
                }}
              >
                Start chat by typing...
              </Text>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ChatBubble
                    text={item.text}
                    role={item.role === "user" ? "user" : "ai"}
                  />
                )}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
              />
            )}
          </View>

          {isCreatingChat && (
            <View style={styles.creatingChatOverlay}>
              <Text style={{ color: themeColors.text }}>Creating chat...</Text>
            </View>
          )}

          {currentChatId && isTodayChat && (
            <MessageInput
              placeholder="Type a message"
              onSend={handleSendMessage}
              disable={isCreatingChat}
            />
          )}

{currentChatId && !isTodayChat && (
        <View style={styles.readOnlyOverlay}>
          <Text style={{ color: themeColors.text, textAlign: 'center' }}>
            This chat is from a previous date. You can only view messages.
          </Text>
        </View>
      )}
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
  creatingChatOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  readOnlyOverlay: {
    padding: 16,
    backgroundColor: theme.colors.infoColor,
    borderTopWidth: 1,
    borderTopColor: theme.colors.infoColor,
  },
});

export default Chat;
