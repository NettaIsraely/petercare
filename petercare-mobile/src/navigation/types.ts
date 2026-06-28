import type { NavigatorScreenParams } from '@react-navigation/native';
import type { HorseColor } from '../types/horse';
import type { TimelineEvent } from '../types/events';

export type HomeScreenParams = {
  eventKind?: TimelineEvent['kind'];
  eventId?: string;
} | undefined;

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type HorsesStackParamList = {
  HorsesList: undefined;
  HorseDetail: {
    horseId: string;
    horseName: string;
    horseColor: HorseColor;
    lastShoeingDate?: string | null;
  };
};
export type MainTabParamList = {
  Home: HomeScreenParams;
  Schedule: undefined;
  Horses: NavigatorScreenParams<HorsesStackParamList>;
  Insights: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ProfileSettings: undefined;
  OwnerDashboard: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
