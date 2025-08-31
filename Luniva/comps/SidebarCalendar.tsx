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

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.8;

const DAY_MARGIN = 3;
const NUM_COLUMNS = 7;
const dayBoxSize = (SIDEBAR_WIDTH - DAY_MARGIN * 2 * NUM_COLUMNS) / NUM_COLUMNS;

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
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  useEffect(() => {
    loadDailyChats(month, year);
  }, [month, year]);

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

  const nonUpcomingChat = chats.find((c: { status: string; date: string }) => c.status !== "upcoming");

  const firstChatDate = new Date(nonUpcomingChat?.date ?? new Date());

  const renderDay = ({ item }: { item: any }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = item.date === todayStr;
    const isPastChat = item.date < todayStr;
    
    let borderColor = theme.colors.secondaryColor;
    let backgroundColor = 'transparent';
  
    if (item.status === "done") {
      borderColor = theme.colors.successColor;
    } else if (isPastChat && item.status !== "done") {
      borderColor = theme.colors.errorColor;
    }
  
    if (isToday) {
      backgroundColor = theme.colors.primaryColor + '20';
    }

    return (
      <TouchableOpacity
        style={[
          styles.dayBox,
          {
            borderColor,
            width: dayBoxSize,
            height: dayBoxSize,
          },
        ]}
        onPress={() => {
          if (new Date(item.date) > new Date()) return;
          if (item.chatId) openDailyChat(item.date);
        }}
      >
        <Text style={{ color: "#fff" }}>{new Date(item.date).getDate()}</Text>
        {isToday && <Text style={styles.todayIndicator}>Today</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        { transform: [{ translateX }] },
        { backgroundColor: themeColors.background },
      ]}
    >
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

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
    padding: 20,
    zIndex: 10,
    height: "95%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  grid: { gap: 8 },
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
    padding: 8,
    backgroundColor: "#444",
    borderRadius: 6,
  },
  todayIndicator: {
    fontSize: 8,
    color: theme.colors.primaryColor,
    position: 'absolute',
    bottom: 2,
  },
});
