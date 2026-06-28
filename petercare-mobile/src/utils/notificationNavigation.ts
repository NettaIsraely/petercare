import type { RefObject } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/types';
import { TimelineEvent } from '../types/events';

function isScheduleEventNotification(data: Record<string, unknown>): boolean {
  return (
    (data.type === 'event-modified' || data.type === 'ride-joined') &&
    typeof data.eventKind === 'string' &&
    typeof data.eventId === 'string'
  );
}

export function navigateFromNotificationData(
  navigationRef: RefObject<NavigationContainerRef<AppStackParamList> | null>,
  data: Record<string, unknown>,
): void {
  if (data.type === 'role-request') {
    navigationRef.current?.navigate('OwnerDashboard');
    return;
  }

  if (data.type === 'role-request-resolved') {
    navigationRef.current?.navigate('ProfileSettings');
    return;
  }

  if (isScheduleEventNotification(data)) {
    navigationRef.current?.navigate('MainTabs', {
      screen: 'Home',
      params: {
        eventKind: data.eventKind as TimelineEvent['kind'],
        eventId: data.eventId as string,
      },
    });
  }
}

export function getNotificationPath(data: Record<string, unknown>): string {
  if (data.type === 'role-request') {
    return '/owner';
  }

  if (data.type === 'role-request-resolved') {
    return '/profile';
  }

  if (isScheduleEventNotification(data)) {
    const params = new URLSearchParams();
    params.set('eventKind', String(data.eventKind));
    params.set('eventId', String(data.eventId));
    return `/home?${params.toString()}`;
  }

  return '/';
}
