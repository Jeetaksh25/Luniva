// backgroundTask.js
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { scheduleDailyNotifications } from "./notificationService";

const TASK_NAME = "DAILY_NOTIFICATION_TASK";

// Define what happens when background task runs
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log("Background task running: scheduling new notifications");
    await scheduleDailyNotifications();
    return BackgroundTask.Result.NewData;
  } catch (err) {
    console.error("Background task failed:", err);
    return BackgroundTask.Result.FAILED;
  }
});

// Register the task
export async function registerBackgroundTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60 * 24, // every 24 hours
      stopOnTerminate: false, // keep after app quit
      startOnBoot: true, // restart on device boot
    });
  }
}
