import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

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
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
