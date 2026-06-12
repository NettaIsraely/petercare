import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import { AppStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{
          presentation: 'modal',
          title: 'Profile Settings',
        }}
      />
      <AppStack.Screen
        name="OwnerDashboard"
        component={OwnerDashboardScreen}
        options={{
          presentation: 'modal',
          title: 'Owner Dashboard',
        }}
      />
    </AppStack.Navigator>
  );
}
