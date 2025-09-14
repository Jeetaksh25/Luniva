import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { scheduleDailyNotifications } from "./notificationService";

const BACKGROUND_TASK_IDENTIFIER = "background-task";

export const initializeBackgroundTask = async () => {
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    try {
      console.log("Background task running: scheduling new notifications");
      await scheduleDailyNotifications();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (err) {
      console.error("Background task failed:", err);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TASK_IDENTIFIER
  );

  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: 1 * 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
};
