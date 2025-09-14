import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { scheduleDailyNotifications } from "./notificationService";

const TASK_NAME = "DAILY_NOTIFICATION_TASK";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log("Background task running: scheduling new notifications");
    await scheduleDailyNotifications();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error("Background task failed:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      stopOnTerminate: false,
      startOnBoot: true,
      // minimumInterval deprecated here but still works for now
    });
  }

  // optional: set minimum interval (deprecated), may add a comment
  await BackgroundFetch.setMinimumIntervalAsync(60 * 60 * 24); // 24h
}
