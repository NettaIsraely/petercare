import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimelineEvent } from '../../types/events';
import EventCard from './EventCard';

interface ItineraryTimelineProps {
  events: TimelineEvent[];
  onMarkFeedingComplete: (id: string) => void;
  onMarkTaskComplete: (id: string) => void;
  completingIds: Set<string>;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ItineraryTimeline({
  events,
  onMarkFeedingComplete,
  onMarkTaskComplete,
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
          const eventId = event.data.id;
          const isCompleting = completingIds.has(eventId);

          return (
            <EventCard
              key={`${event.kind}-${eventId}`}
              event={event}
              showCheckbox={showCheckbox}
              isComplete={isCompleting}
              alertTimes={alertTimes}
              onToggleComplete={
                showCheckbox
                  ? () => {
                      if (event.kind === 'feeding') {
                        onMarkFeedingComplete(eventId);
                      } else if (event.kind === 'task') {
                        onMarkTaskComplete(eventId);
                      }
                    }
                  : undefined
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
