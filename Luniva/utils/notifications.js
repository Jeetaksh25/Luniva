import * as Notifications from 'expo-notifications';

export async function scheduleDailyReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for your daily chat!",
      body: "Spend just 5 minutes with Luniva today ❤️",
    },
    trigger: { hour: 20, minute: 0, repeats: true },
  });
}
