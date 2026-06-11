import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { TimelineEvent } from '../../types/events';
import { CalendarMarkedDates } from '../../utils/scheduleHelpers';
import EventCard from '../home/EventCard';

interface ScheduleCalendarViewProps {
  markedDates: CalendarMarkedDates;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  events: TimelineEvent[];
  onEventPress: (event: TimelineEvent) => void;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ScheduleCalendarView({
  markedDates,
  selectedDate,
  onSelectDate,
  events,
  onEventPress,
  alertTimes,
}: ScheduleCalendarViewProps) {
  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => onSelectDate(day.dateString)}
        theme={{
          todayTextColor: '#3498DB',
          arrowColor: '#3498DB',
          selectedDayBackgroundColor: '#3498DB',
          dotColor: '#3498DB',
        }}
        style={styles.calendar}
      />
      <Text style={styles.sectionTitle}>Events on {selectedDate}</Text>
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events scheduled for this date.</Text>
        </View>
      ) : (
        events.map((event) => (
          <EventCard
            key={`${event.kind}-${event.data.id}`}
            event={event}
            onPress={() => onEventPress(event)}
            alertTimes={alertTimes}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
