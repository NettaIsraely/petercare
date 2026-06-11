import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  LinkingOptions,
  NavigationContainerRef,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { addNotificationResponseListener } from './src/services/pushNotificationService';
import { AppStackParamList } from './src/navigation/types';

const prefix = Linking.createURL('/');
const linking: LinkingOptions<object> = {
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
          },
          Schedule: 'schedule',
          Horses: 'horses',
          Insights: 'insights',
        },
      },
      ProfileSettings: 'profile',
    },
  },
};

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);

  useEffect(() => {
    const subscription = addNotificationResponseListener((data) => {
      if (data.type === 'role-request' || data.type === 'role-request-resolved') {
        navigationRef.current?.navigate('ProfileSettings');
      }
    });

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
