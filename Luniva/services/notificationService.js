import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Notifications as AllNotifications,
  streakNotifications,
} from "../utils/notifications";
import { getTodayDateString } from "@/utils/dateUtils";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useStore } from "../store/useAppStore";

function getRandomNotifications(count, source = AllNotifications) {
  const shuffled = [...source].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function hasChattedToday() {
  try {
    const user = useStore.getState().user;
    if (!user) return false;

    const todayStr = getTodayDateString();
    const chatRef = doc(db, "users", user.uid, "chats", todayStr);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) return false;

    const messagesRef = collection(
      db,
      "users",
      user.uid,
      "chats",
      todayStr,
      "messages"
    );
    const messagesSnap = await getDocs(messagesRef);

    return messagesSnap.size > 0;
  } catch (err) {
    console.error("Error checking hasChattedToday:", err);
    return false;
  }
}

export async function scheduleDailyNotifications() {
  try {
    const today = getTodayDateString();
    const lastScheduled = await AsyncStorage.getItem("lastScheduledDate");

    if (lastScheduled === today) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const notificationIds = [];

    // Main notifications at 10, 13, 16, 19
    const times = [10, 13, 16, 19];
    for (const hour of times) {
      const notifTime = new Date();
      notifTime.setHours(hour, 0, 0, 0);

      // Only schedule future notifications
      if (notifTime <= now) continue;

      const selected = getRandomNotifications(1)[0];
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "Luniva Reminder", body: selected },
        trigger: {
          type: "daily",
          hour: notifTime.getHours(),
          minute: notifTime.getMinutes(),
        },
      });
      notificationIds.push(id);
    }

    // Streak notifications if user hasn't chatted
    const chatted = await hasChattedToday();
    if (!chatted) {
      const streakPick = getRandomNotifications(2, streakNotifications);
      const streakTimes = [12, 18];
      for (let i = 0; i < streakPick.length; i++) {
        const notifTime = new Date();
        notifTime.setHours(streakTimes[i], 30, 0, 0);
        if (notifTime <= now) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: { title: "🔥 Don’t lose your streak!", body: streakPick[i] },
          trigger: {
            type: "daily",
            hour: notifTime.getHours(),
            minute: notifTime.getMinutes(),
          },
        });
        notificationIds.push(id);
      }
    }

    await AsyncStorage.setItem("lastScheduledDate", today);
    await AsyncStorage.setItem(
      "scheduledNotifications",
      JSON.stringify(notificationIds)
    );
  } catch (error) {
    console.error("Failed to schedule notifications:", error);
  }
}
