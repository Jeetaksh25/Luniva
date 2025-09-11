import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  useColorScheme,
  PanResponder,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useStore } from "@/store/useAppStore";
import { theme } from "@/theme/theme";
import { darkenColor } from "@/functions/darkenColor";
import { getTodayDateString, isPastDate } from "@/utils/dateUtils";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import ProfileButton from "@/comps/ProfileButton";
import { useModeColor } from "@/theme/modeColor";
import ProgressButton from "@/comps/ProgressButton";
import { getStreakPercentage } from "@/utils/StreakPercentage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.8;
const SWIPE_THRESHOLD = 50;
const DAY_MARGIN = 2;
const NUM_COLUMNS = 7;
const dayBoxSize =
  (SIDEBAR_WIDTH - DAY_MARGIN * 2 * NUM_COLUMNS - 20) / NUM_COLUMNS;

interface SidebarCalendarProps {
  visible: boolean;
  onClose: () => void;
}

const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
  visible,
  onClose,
}) => {
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [streak, setStreak] = useState(0);
  const [firstChatDate, setFirstChatDate] = useState<Date | null>(null);

  const isMounted = useRef(true);

  const chats = useStore((s) => s.chats);
  const loadDailyChats = useStore((s) => s.loadDailyChats);
  const openDailyChat = useStore((s) => s.openDailyChat);
  const themeColors = useModeColor();

  const user = useStore((s) => s.user);
  const currentDate = useStore((s) => s.currentDate);
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    setStreak(user?.dailyStreak || 0);
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    loadDailyChats(today.getMonth(), today.getFullYear());
    calculateFirstChatDate();
  }, [currentDate]);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : -SIDEBAR_WIDTH, {
      duration: 300,
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (_, gestureState) => {
        translateX.value = Math.min(
          0,
          Math.max(-SIDEBAR_WIDTH, gestureState.dx - SIDEBAR_WIDTH)
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) closeSidebar();
        else translateX.value = withTiming(0, { duration: 200 });
      },
      onPanResponderTerminate: () => {
        translateX.value = withTiming(0, { duration: 200 });
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const closeSidebar = useCallback(() => {
    translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 }, () => {
      if (isMounted.current) runOnJS(onClose)();
    });
  }, [onClose]);

  const calculateFirstChatDate = () => {
    const doneChats = chats.filter((chat: any) => chat.status === "done");
    if (doneChats.length === 0) {
      setFirstChatDate(null);
      return;
    }
    const earliest = doneChats.reduce((a: any, b: any) =>
      new Date(a.date) < new Date(b.date) ? a : b
    );
    setFirstChatDate(new Date(earliest.date));
  };

  const days = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i + 1
      ).padStart(2, "0")}`;
      return (
        chats.find((c: any) => c.date === dateStr) || {
          date: dateStr,
          status: "upcoming",
          chatId: null,
        }
      );
    });
  }, [month, year, chats]);

  const openProfile = () => {
    closeSidebar();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/profile");
  };

  const openProgress = () => {
    closeSidebar();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/progress");
  };

  const renderDay = ({ item }: { item: any }) => {
    if (!item?.date) return null;
    const todayStr = getTodayDateString();
    const isTodayItem = item.date === todayStr;
    const itemDate = new Date(item.date);
    const isPastItem = isPastDate(item.date);
    const hasMessages = item.status === "done";

    let borderColor = theme.colors.secondaryColor;
    let backgroundColor = "transparent";
    let textColor = themeColors.text;
    let opacity = 1;

    if (hasMessages) {
      borderColor = theme.colors.successColor;
    } else if (isPastItem && !hasMessages) {
      borderColor = theme.colors.errorColor;
    }

    if (isTodayItem) {
      backgroundColor = theme.colors.infoColor + "40";
      borderColor = theme.colors.infoColor;
      textColor = theme.colors.infoColor;
    }

    if (!hasMessages && !isTodayItem) {
      opacity = 0.6;
    }

    const handleDayPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (hasMessages) {
        openDailyChat?.(item.date);
        closeSidebar();
      }
    };

    return (
      <Pressable
        style={[
          styles.dayBox,
          {
            borderColor,
            backgroundColor,
            width: dayBoxSize,
            height: dayBoxSize,
            opacity,
          },
        ]}
        onPress={handleDayPress}
        disabled={!hasMessages}
      >
        <Text
          style={{
            color: textColor,
            fontWeight: isTodayItem ? "bold" : "normal",
          }}
        >
          {itemDate.getDate()}
        </Text>
        {isTodayItem && (
          <Text style={[styles.todayIndicator, { color: textColor }]}>
            Today
          </Text>
        )}
      </Pressable>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={closeSidebar}
    >
      <TouchableWithoutFeedback onPress={closeSidebar}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sidebar,
                animatedStyle,
                { backgroundColor: darkenColor(themeColors.background, 10) },
              ]}
              {...panResponder.panHandlers}
            >
              <View
                style={[
                  styles.streakContainer,
                  { backgroundColor: theme.colors.warningColor + "50" },
                ]}
              >
                <Text
                  style={[
                    styles.streakText,
                    { color: theme.colors.warningColor },
                  ]}
                >
                  🔥 {streak} day streak
                </Text>
                <Text
                  style={[styles.streakSubtext, { color: themeColors.text }]}
                >
                  {streak > 0
                    ? "Continue your journey"
                    : "Begin your journey today"}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 20,
                  marginBottom: 15,
                  marginTop: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontWeight: "600",
                    color: themeColors.text,
                    textAlign: "center",
                  }}
                >
                  Monthly Conversations
                </Text>
              </View>

              <View style={styles.header}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setMonth((m) =>
                      m === 0 ? (setYear((y) => y - 1), 11) : m - 1
                    );
                  }}
                >
                  <Feather
                    name="chevron-left"
                    size={24}
                    color={themeColors.text}
                  />
                </Pressable>
                <Text style={[styles.headerText, { color: themeColors.text }]}>
                  {new Date(year, month).toLocaleString("default", {
                    month: "long",
                  })}
                  &nbsp;
                  {year}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setMonth((m) =>
                      m === 11 ? (setYear((y) => y + 1), 0) : m + 1
                    );
                  }}
                >
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={themeColors.text}
                  />
                </Pressable>
              </View>

              <View style={{ flex: 1, marginBottom: 10 }}>
                <FlatList
                  data={days}
                  renderItem={renderDay}
                  keyExtractor={(item, idx) => item?.date ?? `day-${idx}`}
                  numColumns={7}
                  contentContainerStyle={[
                    styles.grid,
                    {
                      backgroundColor: darkenColor(themeColors.background, 20),
                      padding: 10,
                      borderRadius: 10,
                    },
                  ]}
                />
              </View>

              <View style={{paddingTop: 10 }}>
                <ProgressButton
                  onPress={openProgress}
                  progress={getStreakPercentage(user?.dailyStreak || 0)}
                />
              </View>

              <ProfileButton user={user} onPress={openProfile} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SidebarCalendar;

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 1,
    width: SIDEBAR_WIDTH,
    paddingVertical: 10,
    zIndex: 10,
    height: "100%",
    justifyContent: "space-between",
    alignSelf: "center",
  },
  streakContainer: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    width: "95%",
  },
  streakText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  streakSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  grid: {
    gap: 8,
  },
  dayBox: {
    justifyContent: "center",
    alignItems: "center",
    margin: DAY_MARGIN,
    borderWidth: 2,
    borderRadius: 8,
  },
  todayIndicator: {
    fontSize: 8,
    position: "absolute",
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
