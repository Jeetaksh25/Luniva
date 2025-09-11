import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  PanResponder,
  Dimensions,
  BackHandler,
  Image,
} from "react-native";
import MessageInput from "@/comps/MessageInput";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import Feather from "@expo/vector-icons/Feather";
import ChatBubble from "@/comps/ChatBubble";
import SidebarCalendar from "@/comps/SidebarCalendar";
import { useStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import { useDateChange } from "@/utils/useDateChange";
import { getTodayDateString } from "@/utils/dateUtils";
import { transformUserMessage } from "@/utils/transformPrompt";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useModeColor } from "@/theme/modeColor";
import EmptyChat from "@/comps/EmptyChat";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;

const Chat = () => {
  const router = useRouter();
  const themeColors = useModeColor();

  // ---------------- Store (Always called in same order) ----------------
  const messages = useStore((s) => s.messages) ?? [];
  const sendMessage = useStore((s) => s.sendMessage);
  const loadMessages = useStore((s) => s.loadMessages);
  const currentChatId = useStore((s) => s.currentChatId);
  const chats = useStore((s) => s.chats) ?? [];
  const user = useStore((s) => s.user);
  const handleDateChange = useStore((s) => s.handleDateChange);
  const isAiTyping = useStore((s) => s.isAiTyping) ?? false;
  const createTodayChat = useStore((s) => s.createTodayChat);
  const loadingAuth = useStore((s) => s.loadingAuth);
  const loadingChat = useStore((s) => s.loadingChat);

  // ---------------- States & Refs (Always called in same order) ----------------
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState("😀");
  const [lastAIText, setLastAIText] = useState("");
  const [typingText, setTypingText] = useState("Typing…");
  const [isTodayChat, setIsTodayChat] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const float = useSharedValue(0);
  const fade = useSharedValue(1);

  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAiIdRef = useRef<string | null>(null);

  const messageInputRef = useRef<any>(null);

  const focusMessageInput = useCallback(() => {
    messageInputRef.current?.focus();
  }, []);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
    opacity: fade.value,
  }));

  useEffect(() => {
    float.value = withRepeat(
      withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // ---------------- Date Change Hook (Always called) ----------------
  useDateChange(handleDateChange);

  // ---------------- Callbacks (Always called in same order) ----------------
  const toggleSidebar = useCallback((visible: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSidebarVisible(visible);
  }, []);

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/profile");
  }, [router]);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;
      if (!currentChatId) {
        setIsCreatingChat(true);
        try {
          await createTodayChat();
          sendMessage(messageText);
        } catch (err) {
          console.error("Chat creation failed:", err);
        } finally {
          setIsCreatingChat(false);
        }
      } else {
        sendMessage(messageText);
      }
    },
    [currentChatId, createTodayChat, sendMessage]
  );

  // ---------------- Pan Responder (Always called) ----------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.locationX < 30,
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        evt.nativeEvent.locationX < 30 && gestureState.dx > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD / 2 && !sidebarVisible) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setSidebarVisible(true);
        }
      },
    })
  ).current;

  // ---------------- Effects (Always called in same order) ----------------
  // User redirect effect
  useEffect(() => {
    if (!loadingAuth && !user) {
      router.replace("/signin");
    }
  }, [user, router, loadingAuth]);

  // Typing indicator effect
  useEffect(() => {
    if (isAiTyping) {
      let i = 0;
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      typingTimerRef.current = setInterval(() => {
        i = (i + 1) % 3;
        setTypingText(`Typing${".".repeat(i + 1)}`);
      }, 450);
    } else {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setTypingText("Typing…");
    }

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [isAiTyping]);

  // Emoji animation effect
  useEffect(() => {
    const latestAI = [...messages].reverse().find((m: any) => m.role === "ai");
    if (!latestAI) return;

    if (latestAI.id !== lastAiIdRef.current || latestAI.text !== lastAIText) {
      lastAiIdRef.current = latestAI.id;
      setLastAIText(latestAI.text);

      const text = latestAI?.text ?? "";
      const match = text.trim().match(/^(\p{Extended_Pictographic}|\p{Emoji})/u);
      const emoji = match ? match[0] : "🙂";

      fade.value = withTiming(
        0,
        { duration: 150, easing: Easing.out(Easing.ease) },
        () => {
          runOnJS(setCurrentEmoji)(emoji);
          fade.value = withTiming(1, {
            duration: 150,
            easing: Easing.in(Easing.ease),
          });
        }
      );
    }
  }, [messages]);

  // Back button effect
  useEffect(() => {
    const backAction = () => {
      if (sidebarVisible) {
        toggleSidebar(false);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [sidebarVisible, toggleSidebar]);

  // Initialization effect
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!user) return; // wait until user exists
      if (!currentChatId) {
        setIsCreatingChat(true);
        try {
          await createTodayChat();
        } catch (err) {
          console.error("Failed to create chat:", err);
        } finally {
          if (isMounted) setIsCreatingChat(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user, currentChatId, createTodayChat]);

  // Check today's chat effect
  useEffect(() => {
    const todayStr = getTodayDateString();
    const currentChat = chats.find(
      (chat: any) => chat.chatId === currentChatId
    );
    setIsTodayChat(currentChat?.date === todayStr);
  }, [currentChatId, chats]);

  // Load messages effect
  useEffect(() => {
    if (!currentChatId) return;
    const unsubscribe = loadMessages(currentChatId);
    return () => unsubscribe?.();
  }, [currentChatId, loadMessages]);

  // Keyboard listeners effect
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

  // Auto-scroll effect
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderInputComponent = () => {
    if (currentChatId && isTodayChat) {
      return (
        <MessageInput
          ref={messageInputRef}
          placeholder="Type a message"
          onSend={handleSendMessage}
          disable={isCreatingChat}
        />
      );
    } else {
      return (
        <View style={styles.readOnlyOverlay}>
          <Text style={{ color: themeColors.text, textAlign: "center" }}>
            📖 This chat is from a previous date. You can only view messages.
          </Text>
          <TouchableOpacity
            style={styles.todayButton}
            disabled={isCreatingChat || loadingChat}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              try {
                const newId = await createTodayChat();
                // focus the input if it's now created
                focusMessageInput();
                // If needed, mark it as today's chat in local state
                setIsTodayChat(true);
              } catch (err) {
                console.error(
                  "Could not create today's chat on button press:",
                  err
                );
              }
            }}
          >
            <Text style={{ color: "#fff" }}>Go to Today's Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

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
          <TouchableOpacity activeOpacity={0.7} style={{ zIndex: 99 }}>
            <Feather
              name="menu"
              size={theme.fontSize["3xl"]}
              color={themeColors.text}
              style={styles.menuIcon}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleSidebar(true);
              }}
            />
          </TouchableOpacity>

          <View style={styles.userProfile}>
            <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
              {user?.photoBase64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${user.photoBase64}` }}
                  style={styles.avatar}
                />
              ) : (
                <FontAwesome
                  name="user-circle-o"
                  size={45}
                  color={themeColors.text}
                />
              )}
            </TouchableOpacity>
          </View>

          <SidebarCalendar
            visible={sidebarVisible}
            onClose={() => toggleSidebar(false)}
          />

          {messages.length > 0 && (
            <Animated.View style={[styles.emojiContainer, animatedStyle]}>
              <Text
                style={styles.emoji}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {currentEmoji}
              </Text>
              {isAiTyping && (
                <Text
                  style={{
                    textAlign: "center",
                    color: themeColors.text,
                    marginBottom: 8,
                  }}
                >
                  {typingText}
                </Text>
              )}
            </Animated.View>
          )}
          <View style={{ flex: 1 }}>
            {messages.length === 0 ? (
              <EmptyChat
                onStartChat={async () => {
                  await createTodayChat();
                  focusMessageInput();
                }}
              />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, idx) => item?.id ?? `msg-${idx}`}
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

          {renderInputComponent()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: { flex: 1 },
  emojiContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 5,
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
    width: 20,
    zIndex: 100,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 50,
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.colors.primaryColor,
  },
  userProfile: {
    position: "absolute",
    right: 10,
    top: 55,
    zIndex: 99,
  },
});
