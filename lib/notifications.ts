/**
 * Local notifications: permissions, 24h reminder, bookmark milestone.
 *
 * On Android in Expo Go we avoid loading expo-notifications to prevent the SDK 53
 * "Push notifications removed from Expo Go" error. Use a development build for
 * full notification support on Android.
 */

import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { getItemAsync, setItemAsync } from './secure-storage';

const REMINDER_ID = 'course_app_24h_reminder';
const LAST_OPENED_KEY = 'course_app_last_opened';
const BOOKMARK_MILESTONE_SHOWN_KEY = 'course_app_bookmark_milestone_shown';

function shouldSkipNotifications(): boolean {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

async function getNotifications() {
  if (shouldSkipNotifications()) return null;
  return require('expo-notifications') as typeof import('expo-notifications');
}

function isNotificationsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

let handlerSet = false;

async function setHandlerIfNeeded(Notifications: typeof import('expo-notifications')) {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Initialize notification handler early so notifications display when received.
 * Call when app becomes active (e.g. after login).
 */
export async function initNotificationHandler(): Promise<void> {
  if (!isNotificationsSupported() || shouldSkipNotifications()) return;
  try {
    const Notifications = await getNotifications();
    if (Notifications) await setHandlerIfNeeded(Notifications);
  } catch {
    // Ignore
  }
}

/**
 * Request notification permissions. Call early (e.g. after login).
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNotificationsSupported() || shouldSkipNotifications()) return false;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return false;
    await setHandlerIfNeeded(Notifications);
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

const ANDROID_CHANNEL_ID = 'course_app_default';

async function ensureAndroidChannel(Notifications: typeof import('expo-notifications')): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Course App',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    sound: 'default',
  });
}

/**
 * Schedule a one-time reminder in 24 hours. Call when app is opened/foregrounded.
 */
export async function scheduleReminderNotification(): Promise<void> {
  if (!isNotificationsSupported() || shouldSkipNotifications()) return;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await setHandlerIfNeeded(Notifications);
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    await ensureAndroidChannel(Notifications);

    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);

    const TWENTY_FOUR_HOURS_SEC = 24 * 60 * 60;
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'We miss you! 📚',
        body: "Your saved courses are waiting. Open the app to continue learning.",
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: TWENTY_FOUR_HOURS_SEC,
      },
    });

    await setItemAsync(LAST_OPENED_KEY, String(Date.now()));
  } catch {
    // Ignore scheduling errors
  }
}

/**
 * Call when app is opened or comes to foreground. Reschedules 24h reminder.
 */
export async function onAppOpened(): Promise<void> {
  await scheduleReminderNotification();
}

/**
 * Show a one-time notification when the user has bookmarked 5+ courses.
 */
export async function showBookmarkMilestoneIfNeeded(bookmarkCount: number): Promise<void> {
  if (!isNotificationsSupported() || shouldSkipNotifications() || bookmarkCount < 5) return;
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await setHandlerIfNeeded(Notifications);

    const alreadyShown = await getItemAsync(BOOKMARK_MILESTONE_SHOWN_KEY);
    if (alreadyShown === 'true') return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;
    await ensureAndroidChannel(Notifications);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bookmark collection growing! 📑',
        body: `You've saved ${bookmarkCount} courses. Check your bookmarks to pick your next one.`,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
      },
      trigger: null,
    });

    await setItemAsync(BOOKMARK_MILESTONE_SHOWN_KEY, 'true');
  } catch {
    // Ignore
  }
}
