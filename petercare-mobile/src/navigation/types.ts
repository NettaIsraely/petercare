import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type HorsesStackParamList = {
  HorsesList: undefined;
  HorseDetail: {
    horseId: string;
    horseName: string;
    lastShoeingDate?: string | null;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Horses: NavigatorScreenParams<HorsesStackParamList>;
  Insights: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ProfileSettings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
