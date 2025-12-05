// Notifications Service
// Handles push notifications, reminders, and streak alerts

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Configure how notifications behave when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEY = '@ascent_notification_settings';

const DEFAULT_SETTINGS = {
  enabled: true,
  morningReminder: {
    enabled: true,
    hour: 7,
    minute: 0,
  },
  eveningReminder: {
    enabled: true,
    hour: 20,
    minute: 0,
  },
  streakAtRisk: {
    enabled: true,
    hour: 21,
    minute: 0,
  },
  poolLow: {
    enabled: false,
    threshold: 30,
  },
};

// ═══════════════════════════════════════════════════════════════
// PERMISSION HANDLING
// ═══════════════════════════════════════════════════════════════

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return { granted: false, status: finalStatus };
  }
  
  // Get push token for remote notifications (if needed later)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }
  
  return { granted: true, status: finalStatus };
};

/**
 * Check current permission status
 */
export const getNotificationPermissionStatus = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save notification settings
 */
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Reschedule notifications with new settings
    await scheduleAllNotifications(settings);
    return true;
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CONTENT
// ═══════════════════════════════════════════════════════════════

const MORNING_MESSAGES = [
  {
    title: "Fresh pool, fresh start ☀️",
    body: "Your drive pool has refilled. Tackle something meaningful today.",
  },
  {
    title: "Good morning!",
    body: "Your capacity is restored. What's one thing you'll do before noon?",
  },
  {
    title: "New day, full reserves",
    body: "Peak motivation window is now. Hard habits first, easy habits later.",
  },
  {
    title: "Rise and show up",
    body: "You don't need to crush it. You just need to start.",
  },
  {
    title: "Morning check-in",
    body: "Your habits are waiting. Even the 2-minute version counts.",
  },
];

const EVENING_MESSAGES = [
  {
    title: "Evening check",
    body: "How did today go? Review your habits before winding down.",
  },
  {
    title: "Day's end",
    body: "Did you show up for yourself today? Tomorrow's pool depends on it.",
  },
  {
    title: "Before you rest",
    body: "Quick glance at your habits. Any easy wins still possible?",
  },
];

const STREAK_AT_RISK_MESSAGES = [
  {
    title: "Streak alert 🔥",
    body: "You have incomplete habits. Even 2 minutes keeps the chain alive.",
  },
  {
    title: "Don't break the chain",
    body: "Your streak is at risk. The smallest version still counts.",
  },
  {
    title: "One more vote",
    body: "Quick check-in: anything incomplete? Showing up > crushing it.",
  },
];

const POOL_LOW_MESSAGES = [
  {
    title: "Low reserves today",
    body: "Your pool is low. Perfect day for maintenance mode.",
  },
  {
    title: "2-minute day",
    body: "Pool below 30%. Stick to tiny versions today.",
  },
];

/**
 * Get random message from category
 */
const getRandomMessage = (messages) => {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
};

// ═══════════════════════════════════════════════════════════════
// SCHEDULING
// ═══════════════════════════════════════════════════════════════

/**
 * Schedule morning reminder
 */
export const scheduleMorningReminder = async (hour = 7, minute = 0) => {
  await Notifications.cancelScheduledNotificationAsync('morning-reminder');
  
  const message = getRandomMessage(MORNING_MESSAGES);
  
  await Notifications.scheduleNotificationAsync({
    identifier: 'morning-reminder',
    content: {
      title: message.title,
      body: message.body,
      data: { type: 'morning_reminder' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
};

/**
 * Schedule evening reminder
 */
export const scheduleEveningReminder = async (hour = 20, minute = 0) => {
  await Notifications.cancelScheduledNotificationAsync('evening-reminder');
  
  const message = getRandomMessage(EVENING_MESSAGES);
  
  await Notifications.scheduleNotificationAsync({
    identifier: 'evening-reminder',
    content: {
      title: message.title,
      body: message.body,
      data: { type: 'evening_reminder' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
};

/**
 * Schedule streak at risk notification
 * Only triggers if habits are incomplete
 */
export const scheduleStreakAtRiskAlert = async (hour = 21, minute = 0) => {
  await Notifications.cancelScheduledNotificationAsync('streak-risk');
  
  const message = getRandomMessage(STREAK_AT_RISK_MESSAGES);
  
  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-risk',
    content: {
      title: message.title,
      body: message.body,
      data: { type: 'streak_at_risk' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
};

/**
 * Send immediate pool low notification
 */
export const sendPoolLowNotification = async () => {
  const message = getRandomMessage(POOL_LOW_MESSAGES);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      data: { type: 'pool_low' },
    },
    trigger: null, // Immediate
  });
};

/**
 * Schedule all notifications based on settings
 */
export const scheduleAllNotifications = async (settings = null) => {
  const config = settings || await getNotificationSettings();
  
  if (!config.enabled) {
    await cancelAllNotifications();
    return;
  }
  
  if (config.morningReminder.enabled) {
    await scheduleMorningReminder(
      config.morningReminder.hour,
      config.morningReminder.minute
    );
  } else {
    await Notifications.cancelScheduledNotificationAsync('morning-reminder');
  }
  
  if (config.eveningReminder.enabled) {
    await scheduleEveningReminder(
      config.eveningReminder.hour,
      config.eveningReminder.minute
    );
  } else {
    await Notifications.cancelScheduledNotificationAsync('evening-reminder');
  }
  
  if (config.streakAtRisk.enabled) {
    await scheduleStreakAtRiskAlert(
      config.streakAtRisk.hour,
      config.streakAtRisk.minute
    );
  } else {
    await Notifications.cancelScheduledNotificationAsync('streak-risk');
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// ═══════════════════════════════════════════════════════════════
// MILESTONE NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Send milestone celebration notification
 */
export const sendMilestoneNotification = async (milestone) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${milestone.icon} ${milestone.name}!`,
      body: milestone.message,
      data: { type: 'milestone', milestone },
    },
    trigger: null,
  });
};

/**
 * Send streak milestone notification
 */
export const sendStreakMilestoneNotification = async (days) => {
  const milestones = {
    7: { icon: '🌟', title: 'One Week!', body: 'Neural pathways are forming. Keep going.' },
    14: { icon: '🔥', title: 'Two Weeks!', body: 'The habit is taking root. You\'re building something real.' },
    21: { icon: '💪', title: '21 Days!', body: 'Three weeks of showing up. This is becoming automatic.' },
    30: { icon: '🏆', title: '30 Days!', body: 'One month. The hardest part is behind you.' },
    60: { icon: '🧠', title: '60 Days!', body: 'Autopilot achieved. This is who you are now.' },
    90: { icon: '👑', title: '90 Days!', body: 'Quarter year of consistency. Remarkable.' },
  };
  
  const milestone = milestones[days];
  if (milestone) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: milestone.title,
        body: milestone.body,
        data: { type: 'streak_milestone', days },
      },
      trigger: null,
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize notifications on app start
 */
export const initializeNotifications = async () => {
  const permission = await getNotificationPermissionStatus();
  
  if (permission === 'granted') {
    const settings = await getNotificationSettings();
    await scheduleAllNotifications(settings);
  }
  
  return permission;
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION LISTENERS
// ═══════════════════════════════════════════════════════════════

/**
 * Add listener for when notification is received while app is foregrounded
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add listener for when user interacts with notification
 */
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleMorningReminder,
  scheduleEveningReminder,
  scheduleStreakAtRiskAlert,
  sendPoolLowNotification,
  scheduleAllNotifications,
  cancelAllNotifications,
  sendMilestoneNotification,
  sendStreakMilestoneNotification,
  initializeNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
};
