import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  BackHandler,
} from "react-native";
import MessageInput from "@/comps/MessageInput";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import Feather from "@expo/vector-icons/Feather";
import ChatBubble from "@/comps/ChatBubble";
import SidebarCalendar from "@/comps/SidebarCalendar";
import { useStore } from "@/store/useAppStore";
import { useRouter, Redirect } from "expo-router";
import { useDateChange } from "@/utils/useDateChange";
import { getTodayDateString } from "@/utils/dateUtils";
import { transformUserMessage } from "@/utils/transformPrompt";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;

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
  const [lastAIText, setLastAIText] = useState("");

  const {
    messages,
    sendMessage,
    loadMessages,
    currentChatId,
    chats,
    user,
    handleDateChange,
  } = useStore();
  const [isTodayChat, setIsTodayChat] = useState(true);
  const router = useRouter();

  useDateChange((newDate: string) => handleDateChange(newDate));

  useEffect(() => {
    const latestAIMessage = messages.findLast((m: any) => m.role === "ai");
    if (latestAIMessage && latestAIMessage.text !== lastAIText) {
      const cleanText = extractEmojiAndSet(latestAIMessage.text);
      setLastAIText(latestAIMessage.text);
      // Optionally store cleaned text somewhere if needed
    }
  }, [messages]);

  const extractEmojiAndSet = (text: string) => {
    const match = text.match(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+/u);
    const emoji = match ? match[0] : "🙂";
    animateEmojiChange(() => setCurrentEmoji(emoji));
    return text.replace(emoji, "").trim();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only capture if starting from left edge
        return evt.nativeEvent.locationX < 30;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture if starting from left edge and moving right
        return evt.nativeEvent.locationX < 30 && gestureState.dx > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Optional: Add visual feedback for swipe
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 20) {
          setSidebarVisible(true);
        }
      },
      onPanResponderTerminate: () => {},
      onPanResponderReject: () => {},
      onShouldBlockNativeResponder: () => false, // Allow other components to respond
    })
  ).current;

  // Also add this useEffect to handle back button/gesture
  useEffect(() => {
    const backAction = () => {
      if (sidebarVisible) {
        setSidebarVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [sidebarVisible]);

  // Main initialization effect
  useEffect(() => {
    const init = async () => {
      const { user } = useStore.getState();
      if (!user) {
        router.replace("/signin");
        return;
      }

      // Ensure today's chat exists
      if (!currentChatId) {
        setIsCreatingChat(true);
        try {
          await useStore.getState().createTodayChat();
        } catch (err) {
          console.error("Failed to create chat:", err);
        } finally {
          setIsCreatingChat(false);
        }
      }
    };

    init();
  }, [currentChatId]);

  // Track if current chat is today's
  useEffect(() => {
    const todayStr = getTodayDateString();
    const currentChat = chats.find(
      (chat: any) => chat.chatId === currentChatId
    );
    setIsTodayChat(currentChat?.date === todayStr);
  }, [currentChatId, chats]);

  // Load messages for current chat
  useEffect(() => {
    if (!currentChatId) return;
    const unsubscribe = loadMessages(currentChatId);
    return () => unsubscribe && unsubscribe();
  }, [currentChatId]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const friendlyPrompt = transformUserMessage(messageText);

    if (!currentChatId) {
      setIsCreatingChat(true);
      try {
        await useStore.getState().createTodayChat();
        sendMessage(messageText);
      } catch (err) {
        console.error("Chat creation failed:", err);
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

  if (!user) return <Redirect href="/signin" />;

  return (
    <View
      style={{ flex: 1, backgroundColor: themeColors.background }}
      {...panResponder.panHandlers}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                    text={
                      item.role === "ai"
                        ? item.text
                            .replace(
                              /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+/u,
                              ""
                            )
                            .trim()
                        : item.text
                    }
                    role={item.role}
                  />
                )}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            )}
          </View>

          {isCreatingChat && (
            <View style={styles.creatingChatOverlay}>
              <Text style={{ color: themeColors.text }}>Creating chat...</Text>
            </View>
          )}

          {currentChatId && isTodayChat ? (
            <MessageInput
              placeholder="Type a message"
              onSend={handleSendMessage}
              disable={isCreatingChat}
            />
          ) : (
            <View style={styles.readOnlyOverlay}>
              <Text style={{ color: themeColors.text, textAlign: "center" }}>
                📖 This chat is from a previous date. You can only view
                messages.
              </Text>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => useStore.getState().createTodayChat()}
              >
                <Text style={{ color: "#fff" }}>Go to Today's Chat</Text>
              </TouchableOpacity>
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
  emoji: { fontSize: 80 },
  listContent: { paddingHorizontal: 20, paddingVertical: 5, flexGrow: 1 },
  menuIcon: { position: "absolute", top: 60, left: 20, zIndex: 1 },
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
  todayButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.primaryColor,
    borderRadius: 8,
    alignSelf: "center",
  },
  edgeSwipeDetector: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 20, // Very thin strip
    zIndex: 100,
    // backgroundColor: 'transparent' // Keep it invisible
  },
});

export default Chat;
