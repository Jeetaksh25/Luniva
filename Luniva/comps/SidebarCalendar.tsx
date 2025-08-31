import React, { useState, useEffect } from "react";
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
import { getTodayDateString, isToday } from '@/utils/dateUtils';

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
  const chats = useStore((s) => s.chats);
  const loadDailyChats = useStore((s) => s.loadDailyChats);
  const openDailyChat = useStore((s) => s.openDailyChat);
  const getUserData = useStore((s) => s.getUserData);
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const { user, currentDate } = useStore();
  const [streak, setStreak] = useState(0);
  const [firstChatDate, setFirstChatDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      console.log("📊 Current user streak:", user.dailyStreak);
      setStreak(user.dailyStreak || 0);
    }
  }, [user]);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    setMonth(currentMonth);
    setYear(currentYear);
    loadDailyChats(currentMonth, currentYear);
    calculateFirstChatDate();
  }, [currentDate]);

  // In your Chat component, add this
  useEffect(() => {
    // Debug date info on component mount
    const debugInfo = useStore.getState().debugDateInfo();
    console.log("📋 Initial date debug:", debugInfo);
  }, []);

  const calculateFirstChatDate = () => {
    const doneChats = chats.filter((chat: any) => chat.status === "done");
    if (doneChats.length > 0) {
      // Find the earliest chat date
      const earliestChat = doneChats.reduce((earliest: any, current: any) => {
        return new Date(current.date) < new Date(earliest.date)
          ? current
          : earliest;
      });
      setFirstChatDate(new Date(earliestChat.date));
    } else {
      setFirstChatDate(null);
    }
  };

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    const chatData = chats.find(
      (c: { date: string; status: string; chatId: string | null }) =>
        c.date === dateStr
    );
    return chatData || { date: dateStr, status: "upcoming", chatId: null };
  });

  const handlePrevMonth = () => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
  
    setMonth(currentMonth);
    setYear(currentYear);
    loadDailyChats(currentMonth, currentYear);
    calculateFirstChatDate();
    
    // Debug: check all chats
    useStore.getState().debugChats();
  }, [currentDate]);

// In your SidebarCalendar or anywhere
useEffect(() => {
  useStore.getState().debugAugust31Chat();
}, []);

  const renderDay = ({ item }: { item: any }) => {
    const todayStr = getTodayDateString();
    const isTodayItem = item.date === todayStr;
    const itemDate = new Date(item.date);
    const currentDate = new Date();
    
    // Reset time part for proper date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    itemDate.setHours(0, 0, 0, 0);
  
    let borderColor = theme.colors.secondaryColor;
    let backgroundColor = "transparent";
    let textColor = themeColors.text;
    let opacity = 1;
  
    // Determine colors based on the requirements
    if (item.status === "done") {
      // Chats with messages - successColor
      borderColor = theme.colors.successColor;
    } else if (itemDate < today && item.status !== "done") {
      // Past dates without chats - errorColor
      borderColor = theme.colors.errorColor;
    } else {
      // Future dates or upcoming chats - secondaryColor
      borderColor = theme.colors.secondaryColor;
    }
  
    // Today gets special styling
    if (isTodayItem) {
      backgroundColor = theme.colors.infoColor + "40"; // Add transparency
      borderColor = theme.colors.infoColor;
      textColor = theme.colors.infoColor;
    }
  
    // Dim future dates and non-clickable dates
    if (itemDate > currentDate || item.status !== "done") {
      opacity = 0.6;
    }
  
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
        onPress={() => {
          // Only allow clicking on dates with completed chats
          if (item.status !== "done") return;
          openDailyChat(item.date);
        }}
        disabled={item.status !== "done"}
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

      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Feather name="chevron-left" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: themeColors.text }]}>
          {new Date(year, month).toLocaleString("default", { month: "long" })}{" "}
          {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Feather name="chevron-right" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={days}
        renderItem={renderDay}
        keyExtractor={(item) => item.date}
        numColumns={7}
        contentContainerStyle={styles.grid}
      />

      <TouchableOpacity
        style={[
          styles.closeBtn,
          { backgroundColor: theme.colors.secondaryColor },
        ]}
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
