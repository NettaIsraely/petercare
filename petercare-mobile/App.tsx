import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  NavigationContainer,
  LinkingOptions,
  NavigationContainerRef,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { addNotificationResponseListener } from './src/services/pushNotificationService';
import { AppStackParamList } from './src/navigation/types';
import { navigateFromNotificationData } from './src/utils/notificationNavigation';

const prefix = Linking.createURL('/');
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [prefix, 'stablehands://'],
  config: {
    screens: {
      Login: 'reset-password',
      SignUp: 'signup',
      MainTabs: {
        screens: {
          Home: {
            path: 'home',
            alias: ['dashboard'],
            parse: {
              eventKind: String,
              eventId: String,
            },
          },
          Schedule: 'schedule',
          Horses: 'horses',
          Insights: 'insights',
        },
      },
      ProfileSettings: 'profile',
      OwnerDashboard: 'owner',
    },
  },
};

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      let cleanup: (() => void) | undefined;
      let isMounted = true;

      void import('./src/services/webPushNotificationService').then(
        ({ setupWebNotificationHandlers }) => {
          if (!isMounted) {
            return;
          }

          cleanup = setupWebNotificationHandlers(navigationRef);
        },
      );

      return () => {
        isMounted = false;
        cleanup?.();
      };
    }

    const handleNotificationResponse = (data: Record<string, unknown>) => {
      navigateFromNotificationData(navigationRef, data);
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) {
        return;
      }

      const data = response.notification.request.content.data as Record<string, unknown>;
      handleNotificationResponse(data);
    });

    const subscription = addNotificationResponseListener(handleNotificationResponse);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer linking={linking} ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
