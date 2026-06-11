import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeekDaySection } from '../../types/events';
import { isCompletingKey } from '../../utils/completionKeys';
import EventCard from './EventCard';

interface ItineraryTimelineProps {
  daySections: WeekDaySection[];
  onMarkComplete: (event: WeekDaySection['events'][number]) => void;
  completingIds: Set<string>;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ItineraryTimeline({
  daySections,
  onMarkComplete,
  completingIds,
  alertTimes,
}: ItineraryTimelineProps) {
  if (daySections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events scheduled for you this week.</Text>
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
            const showCheckbox = event.kind === 'feeding' || event.kind === 'task';
            const isCompleting =
              event.kind === 'feeding'
                ? isCompletingKey(completingIds, 'feeding', event.data.id)
                : event.kind === 'task'
                  ? isCompletingKey(completingIds, 'task', event.data.id)
                  : false;

            return (
              <EventCard
                key={`${event.kind}-${event.data.id}`}
                event={event}
                showCheckbox={showCheckbox}
                isCompleting={isCompleting}
                alertTimes={alertTimes}
                onToggleComplete={
                  showCheckbox ? () => onMarkComplete(event) : undefined
                }
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
