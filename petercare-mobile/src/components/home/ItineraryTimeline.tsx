import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeekDaySection } from '../../types/events';
import { UserRole } from '../../types/auth';
import { isCompletingKey } from '../../utils/completionKeys';
import { canToggleComplete } from '../../utils/eventPermissions';
import { isEventCompleted } from '../../utils/scheduleHelpers';
import EventCard from './EventCard';

interface ItineraryTimelineProps {
  daySections: WeekDaySection[];
  onToggleComplete: (event: WeekDaySection['events'][number]) => void;
  onEventPress: (event: WeekDaySection['events'][number]) => void;
  completingIds: Set<string>;
  userRole?: UserRole;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ItineraryTimeline({
  daySections,
  onToggleComplete,
  onEventPress,
  completingIds,
  userRole,
  currentUserId,
  alertTimes,
}: ItineraryTimelineProps) {
  if (daySections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events scheduled for you.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {daySections.map((section) => (
        <View key={section.date} style={styles.daySection}>
          <Text style={styles.dayHeader}>
            {section.dayName} · {section.dateLabel}
          </Text>
          {section.events.map((event) => {
            const completed = isEventCompleted(event);
            const canToggle = canToggleComplete(userRole, event, currentUserId);
            const isCompleting =
              event.kind === 'feeding'
                ? isCompletingKey(completingIds, 'feeding', event.data.id)
                : event.kind === 'task'
                  ? isCompletingKey(completingIds, 'task', event.data.id)
                  : event.kind === 'treatment'
                    ? isCompletingKey(completingIds, 'treatment', event.data.id)
                    : false;

            return (
              <EventCard
                key={`${event.kind}-${event.data.id}`}
                event={event}
                showCheckbox={canToggle}
                checked={completed}
                completed={completed}
                isCompleting={isCompleting}
                alertTimes={alertTimes}
                onToggleComplete={canToggle ? () => onToggleComplete(event) : undefined}
                onPress={() => onEventPress(event)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 10,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
