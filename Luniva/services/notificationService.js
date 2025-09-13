// notificationService.js
import * as Notifications from "expo-notifications";
import {
  Notifications as AllNotifications,
  streakNotifications,
} from "../utils/notifications";
import { getTodayDateString } from "@/utils/dateUtils";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useStore } from "../store/useAppStore";

// Helper to pick N random unique messages
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

    // Check messages collection
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
  // Cancel old ones so we don’t stack infinitely
  await Notifications.cancelAllScheduledNotificationsAsync();

  const selected = getRandomNotifications(4);

  // Example times (10 AM, 1 PM, 4 PM, 7 PM)
  const times = [10, 13, 16, 19];

  for (let i = 0; i < selected.length; i++) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Luniva Reminder",
        body: selected[i],
      },
      trigger: {
        hour: times[i],
        minute: 0,
        repeats: true,
      },
    });
  }

  const chatted = await hasChattedToday();
  if (!chatted) {
    const streakPick = getRandomNotifications(2, streakNotifications); // pick 2 streak reminders
    const streakTimes = [12, 18]; // noon & evening

    for (let i = 0; i < streakPick.length; i++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔥 Don’t lose your streak!",
          body: streakPick[i],
        },
        trigger: {
          hour: streakTimes[i],
          minute: 30,
          repeats: true,
        },
      });
    }
  }
}
