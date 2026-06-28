import type { RefObject } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { getToken, onMessage } from 'firebase/messaging';
import {
  getFirebaseMessaging,
  getVapidKey,
  isFirebaseConfigured,
} from '../config/firebase.web';
import { AppStackParamList } from '../navigation/types';
import {
  navigateFromNotificationData,
} from '../utils/notificationNavigation';
import * as userService from './userService';

const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';

let registeredUserId: string | null = null;

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function canRegisterWebPush(): boolean {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }

  if (!isFirebaseConfigured()) {
    console.info('Firebase web push is not configured.');
    return false;
  }

  if (isIosSafari() && !isStandalonePwa()) {
    console.info(
      'Web push on iOS requires the app to be added to the Home Screen.',
    );
    return false;
  }

  return true;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn('Failed to register Firebase service worker:', error);
    return null;
  }
}

export async function registerWebPushToken(userId: string): Promise<void> {
  if (!canRegisterWebPush()) {
    return;
  }

  registeredUserId = userId;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return;
  }

  const messaging = await getFirebaseMessaging();
  const serviceWorkerRegistration = await getServiceWorkerRegistration();
  const vapidKey = getVapidKey();

  if (!messaging || !serviceWorkerRegistration || !vapidKey) {
    return;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (!token) {
      return;
    }

    await userService.updateUser(userId, {
      expo_push_token: token,
    });
  } catch (error) {
    console.warn('Failed to register web push token:', error);
  }
}

export function setupWebNotificationHandlers(
  navigationRef: RefObject<NavigationContainerRef<AppStackParamList> | null>,
): () => void {
  let unsubscribe: (() => void) | undefined;
  let isMounted = true;

  void getFirebaseMessaging().then((messaging) => {
    if (!messaging || !isMounted) {
      return;
    }

    unsubscribe = onMessage(messaging, (payload) => {
      const data = (payload.data ?? {}) as Record<string, unknown>;
      const title = payload.notification?.title ?? 'Peter Care';
      const body = payload.notification?.body ?? '';

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          data,
          icon: '/apple-touch-icon.png',
        });

        notification.onclick = () => {
          window.focus();
          navigateFromNotificationData(navigationRef, data);
          notification.close();
        };
      } else {
        navigateFromNotificationData(navigationRef, data);
      }
    });
  });

  const handleFocus = () => {
    if (registeredUserId) {
      void registerWebPushToken(registeredUserId);
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type !== 'NOTIFICATION_CLICK') {
      return;
    }

    navigateFromNotificationData(
      navigationRef,
      (event.data.data ?? {}) as Record<string, unknown>,
    );
  };

  window.addEventListener('focus', handleFocus);
  navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

  return () => {
    isMounted = false;
    unsubscribe?.();
    window.removeEventListener('focus', handleFocus);
    navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
  };
}
