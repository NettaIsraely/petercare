import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HorsesScreen from '../screens/HorsesScreen';
import HorseDetailScreen from '../screens/HorseDetailScreen';
import { HorsesStackParamList } from './types';

const Stack = createNativeStackNavigator<HorsesStackParamList>();

export default function HorsesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HorsesList"
        component={HorsesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HorseDetail"
        component={HorseDetailScreen}
        options={({ route }) => ({
          title: route.params.horseName,
        })}
      />
    </Stack.Navigator>
  );
}
