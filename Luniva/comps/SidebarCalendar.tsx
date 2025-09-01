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
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useStore } from "@/store/useAppStore";
import { theme } from "@/theme/theme";
import { darkenColor } from "@/functions/darkenColor";
import { getTodayDateString, isToday, isPastDate, isFutureDate } from "@/utils/dateUtils";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.8;

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

  const { user, currentDate } = useStore();

  /** Setup streak when user data updates */
  useEffect(() => {
    setStreak(user?.dailyStreak || 0);
  }, [user]);

  /** Load chats for current month and calculate first chat date */
  useEffect(() => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    loadDailyChats(today.getMonth(), today.getFullYear());
    calculateFirstChatDate();
  }, [currentDate]);

  /** Debug only in development */
  useEffect(() => {
    if (__DEV__) {
      console.log("📋 Initial date debug:", useStore.getState().debugDateInfo());
      useStore.getState().debugChats();
      useStore.getState().debugAugust31Chat();
    }
  }, []);

  /** Slide animation */
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  /** Calculate first chat date */
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

  /** Days of month (memoized) */
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

  /** Render day cell */
  const todayStr = getTodayDateString();
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
  
    // Determine status - FIXED logic
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
  
    return (
      <TouchableOpacity
        style={[styles.dayBox, { borderColor, backgroundColor, width: dayBoxSize, height: dayBoxSize, opacity }]}
        onPress={() => hasMessages && openDailyChat(item.date)}
        disabled={!hasMessages}
      >
        <Text style={{ color: textColor, fontWeight: isTodayItem ? "bold" : "normal" }}>
          {itemDate.getDate()}
        </Text>
        {isTodayItem && <Text style={[styles.todayIndicator, { color: textColor }]}>Today</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        { transform: [{ translateX }] },
        { backgroundColor: darkenColor(themeColors.background, 10) },
      ]}
    >
      {/* Streak Display */}
      <View
        style={[
          styles.streakContainer,
          { backgroundColor: theme.colors.warningColor + "20" },
        ]}
      >
        <Text style={[styles.streakText, { color: theme.colors.warningColor }]}>
          🔥 {streak} day streak
        </Text>
        <Text style={[styles.streakSubtext, { color: themeColors.text }]}>
          {streak > 0 ? "Keep it going!" : "Start your streak today!"}
        </Text>
      </View>

      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setMonth((m) => (m === 0 ? (setYear((y) => y - 1), 11) : m - 1))}
        >
          <Feather name="chevron-left" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: themeColors.text }]}>
          {new Date(year, month).toLocaleString("default", { month: "long" })}{" "}
          {year}
        </Text>
        <TouchableOpacity
          onPress={() => setMonth((m) => (m === 11 ? (setYear((y) => y + 1), 0) : m + 1))}
        >
          <Feather name="chevron-right" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <FlatList
        data={days}
        renderItem={renderDay}
        keyExtractor={(item) => item.date}
        numColumns={7}
        contentContainerStyle={styles.grid}
      />

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: theme.colors.secondaryColor }]}
        onPress={onClose}
      >
        <Text style={{ color: "#fff" }}>Close</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SidebarCalendar;

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    padding: 10,
    zIndex: 10,
    height: "95%",
  },
  streakContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
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
  closeBtn: {
    marginTop: 20,
    alignSelf: "center",
    padding: 12,
    borderRadius: 8,
  },
  todayIndicator: {
    fontSize: 8,
    position: "absolute",
    bottom: 0,
  },
});
