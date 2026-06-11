import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimelineEvent } from '../../types/events';
import { isCompletingKey } from '../../utils/completionKeys';
import EventCard from './EventCard';

interface ItineraryTimelineProps {
  events: TimelineEvent[];
  onMarkComplete: (event: TimelineEvent) => void;
  completingIds: Set<string>;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ItineraryTimeline({
  events,
  onMarkComplete,
  completingIds,
  alertTimes,
}: ItineraryTimelineProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today&apos;s Itinerary</Text>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events scheduled for you today.</Text>
        </View>
      ) : (
        events.map((event) => {
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
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
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
