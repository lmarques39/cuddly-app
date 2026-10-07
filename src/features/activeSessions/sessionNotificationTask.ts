import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { handleFinishTap } from './sessionNotification';

const SESSION_ACTION_TASK = 'cuddly-active-session-action';

/**
 * "Terminar" on the running-timer notification (#101) with the app in the
 * background or not running at all: Android hands the tap to this task
 * instead of opening the app. Must be defined at module scope of something
 * index.ts loads, because expo-task-manager boots the JS bundle headless
 * just to run it — there's no React tree, so no ActiveSessionsProvider.
 */
if (Platform.OS === 'android') {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(SESSION_ACTION_TASK, async ({ data }) => {
    if (data && 'actionIdentifier' in data) {
      await handleFinishTap(data);
    }
  });
  Notifications.registerTaskAsync(SESSION_ACTION_TASK).catch(() => {});
}
