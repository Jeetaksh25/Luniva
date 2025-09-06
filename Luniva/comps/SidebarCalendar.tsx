import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
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
import { modeColor } from "@/theme/modeColor";

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
  const [translateX] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [streak, setStreak] = useState(0);
  const [firstChatDate, setFirstChatDate] = useState<Date | null>(null);

  const chats = useStore((s) => s.chats);
  const loadDailyChats = useStore((s) => s.loadDailyChats);
  const openDailyChat = useStore((s) => s.openDailyChat);
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const { user, currentDate, logout } = useStore();

  useEffect(() => {
    setStreak(user?.dailyStreak || 0);
  }, [user]);

  useEffect(() => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    loadDailyChats(today.getMonth(), today.getFullYear());
    calculateFirstChatDate();
  }, [currentDate]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0) {
        translateX.setValue(Math.min(0, -SIDEBAR_WIDTH + gestureState.dx));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SWIPE_THRESHOLD) {
        closeSidebar();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    },
    onPanResponderTerminationRequest: () => false,
  });

  const closeSidebar = () => {
    Animated.timing(translateX, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

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

  const renderDay = ({ item }: { item: any }) => {
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
        openDailyChat(item.date);
        closeSidebar();
      }
    };

    return (
      <TouchableOpacity
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
      </TouchableOpacity>
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
                { transform: [{ translateX }] },
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
                  {streak > 0 ? "Keep it going!" : "Start your streak today!"}
                </Text>
              </View>

              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() =>{
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setMonth((m) =>
                      m === 0 ? (setYear((y) => y - 1), 11) : m - 1
                    )
                  }}
                >
                  <Feather
                    name="chevron-left"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
                <Text style={[styles.headerText, { color: themeColors.text }]}>
                  {new Date(year, month).toLocaleString("default", {
                    month: "long",
                  })}
                  {year}
                </Text>
                <TouchableOpacity
                  onPress={() =>{
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setMonth((m) =>
                      m === 11 ? (setYear((y) => y + 1), 0) : m + 1
                    )
                  }}
                >
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={days}
                renderItem={renderDay}
                keyExtractor={(item) => item.date}
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
    marginBottom: 20,
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
    marginBottom: 20,
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
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
