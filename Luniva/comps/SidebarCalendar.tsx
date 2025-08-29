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
    const chatData = chats.find((c: { date: string; status: string; chatId: string | null }) => c.date === dateStr);
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

  const renderDay = ({ item }: { item: any }) => {
    let borderColor = theme.colors.secondaryColor;
    if (item.status === "done") borderColor = theme.colors.successColor;
    else if (item.status === "missed") borderColor = theme.colors.errorColor;

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
          if (item.chatId || item.status === "done" || item.status === "missed")
            openDailyChat(item.date);
        }}
      >
        <Text style={{ color: "#fff" }}>{new Date(item.date).getDate()}</Text>
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
});
