import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as userService from './userService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3498DB',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch (error) {
    console.error('Failed to get Expo push token:', error);
    return null;
  }
}

export async function syncUserTimezone(userId: string): Promise<void> {
  try {
    await userService.updateUser(userId, { timezone: getDeviceTimezone() });
  } catch (error) {
    console.warn('Failed to sync user timezone:', error);
  }
}

export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') {
    const { registerWebPushToken } = await import('./webPushNotificationService');
    await registerWebPushToken(userId);
    return;
  }

  const timezone = getDeviceTimezone();
  const token = await getExpoPushToken();

  if (!token) {
    await syncUserTimezone(userId);
    return;
  }

  try {
    await userService.updateUser(userId, {
      expo_push_token: token,
      timezone,
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

export function addNotificationResponseListener(
  handler: (data: Record<string, unknown>) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    handler(data);
  });
}
