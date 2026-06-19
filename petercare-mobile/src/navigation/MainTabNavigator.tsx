import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CalendarDays, Warehouse, BarChart3, User, LayoutDashboard } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HorsesStackNavigator from './HorsesStackNavigator';
import InsightsScreen from '../screens/InsightsScreen';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        tabBarActiveTintColor: '#3498DB',
        tabBarInactiveTintColor: '#7F8C8D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E6ED',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#2C3E50',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 }}>
            {isOwner ? (
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('OwnerDashboard')}
                accessibilityLabel="Open owner dashboard"
              >
                <LayoutDashboard size={22} color="#2C3E50" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('ProfileSettings')}
              accessibilityLabel="Open profile settings"
            >
              <User size={22} color="#2C3E50" />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'My Schedule',
          tabBarLabel: 'My Schedule',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Stable Planner',
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Horses"
        component={HorsesStackNavigator}
        options={{
          title: 'The Barn',
          tabBarLabel: 'Barn',
          tabBarIcon: ({ color, size }) => <Warehouse color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
