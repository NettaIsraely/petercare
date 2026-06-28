import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TimelineEvent } from '../../types/events';
import { formatWeekDayHeader } from '../../utils/dateHelpers';
import CompactEventBlock from './CompactEventBlock';

const DAY_COLUMN_WIDTH = 108;

interface WeekDayColumnsProps {
  weekDates: string[];
  weekEvents: Record<string, TimelineEvent[]>;
  onEventPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function WeekDayColumns({
  weekDates,
  weekEvents,
  onEventPress,
  currentUserId,
  alertTimes,
}: WeekDayColumnsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.columnsRow}>
        {weekDates.map((date) => {
          const { dayName, dateLabel } = formatWeekDayHeader(date);
          const dayEvents = weekEvents[date] ?? [];

          return (
            <View key={date} style={styles.dayColumn}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{dayName}</Text>
                <Text style={styles.dayDate}>{dateLabel}</Text>
              </View>
              <View style={styles.eventsStack}>
                {dayEvents.length === 0 ? (
                  <Text style={styles.emptyText}>No events</Text>
                ) : (
                  dayEvents.map((event) => (
                    <CompactEventBlock
                      key={`${event.kind}-${event.data.id}`}
                      event={event}
                      onPress={() => onEventPress(event)}
                      currentUserId={currentUserId}
                      alertTimes={alertTimes}
                    />
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayColumn: {
    width: DAY_COLUMN_WIDTH,
    paddingHorizontal: 2,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C3E50',
  },
  dayDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 2,
  },
  eventsStack: {
    flexDirection: 'column',
  },
  emptyText: {
    fontSize: 10,
    color: '#BDC3C7',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
