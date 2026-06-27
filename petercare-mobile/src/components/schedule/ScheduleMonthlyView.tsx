import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { TimelineEvent } from '../../types/events';
import { CalendarMarkedDates } from '../../utils/scheduleHelpers';
import EventCard from '../home/EventCard';
import { UserSummary } from '../../types/user';
import { isEventCompleted } from '../../utils/scheduleHelpers';
import { isToday, normalizeDateString, toDateString } from '../../utils/dateHelpers';
import JumpToTodayButton from '../shared/JumpToTodayButton';

interface ScheduleMonthlyViewProps {
  markedDates: CalendarMarkedDates;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  events: TimelineEvent[];
  onEventPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  users?: UserSummary[];
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

function getMonthKey(dateStr: string): string {
  const normalized = normalizeDateString(dateStr);
  return normalized.slice(0, 7);
}

export default function ScheduleMonthlyView({
  markedDates,
  selectedDate,
  onSelectDate,
  events,
  onEventPress,
  currentUserId,
  users,
  alertTimes,
}: ScheduleMonthlyViewProps) {
  const today = toDateString(new Date());
  const [displayMonth, setDisplayMonth] = useState(selectedDate);

  useEffect(() => {
    setDisplayMonth(selectedDate);
  }, [selectedDate]);

  const showTodayButton =
    !isToday(selectedDate) || getMonthKey(displayMonth) !== getMonthKey(today);

  const handleJumpToToday = () => {
    onSelectDate(today);
    setDisplayMonth(today);
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        {showTodayButton ? (
          <View style={styles.todayBar}>
            <JumpToTodayButton
              label="Today"
              variant="compact-pill"
              onPress={handleJumpToToday}
            />
          </View>
        ) : null}

        <Calendar
          initialDate={displayMonth}
          onMonthChange={(month) => setDisplayMonth(month.dateString)}
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
      </View>
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
            currentUserId={currentUserId}
            showAssignee
            users={users}
            completed={isEventCompleted(event)}
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
  calendarWrapper: {
    marginBottom: 16,
  },
  todayBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  calendar: {
    borderRadius: 12,
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
