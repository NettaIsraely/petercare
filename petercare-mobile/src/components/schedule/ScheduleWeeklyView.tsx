import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import {
  getRollingWeekDateStrings,
  getWeekRangeLabel,
  isToday,
  shiftDateByWeeks,
  toDateString,
} from '../../utils/dateHelpers';
import WeekDayColumns from './WeekDayColumns';
import JumpToTodayButton from '../shared/JumpToTodayButton';

interface ScheduleWeeklyViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  weekEvents: Record<string, TimelineEvent[]>;
  onEventPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ScheduleWeeklyView({
  selectedDate,
  onSelectDate,
  weekEvents,
  onEventPress,
  currentUserId,
  alertTimes,
}: ScheduleWeeklyViewProps) {
  const weekDates = useMemo(
    () => getRollingWeekDateStrings(selectedDate),
    [selectedDate]
  );
  const weekLabel = useMemo(() => getWeekRangeLabel(weekDates), [weekDates]);

  const handlePrevWeek = () => {
    onSelectDate(shiftDateByWeeks(selectedDate, -1));
  };

  const handleNextWeek = () => {
    onSelectDate(shiftDateByWeeks(selectedDate, 1));
  };

  const handleJumpToToday = () => {
    onSelectDate(toDateString(new Date()));
  };

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrevWeek}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
        >
          <ChevronLeft size={20} color="#3498DB" />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          {!isToday(selectedDate) ? (
            <JumpToTodayButton
              label="Today"
              variant="compact-pill"
              onPress={handleJumpToToday}
              style={styles.todayButton}
            />
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextWeek}
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <ChevronRight size={20} color="#3498DB" />
        </TouchableOpacity>
      </View>

      <WeekDayColumns
        weekDates={weekDates}
        weekEvents={weekEvents}
        onEventPress={onEventPress}
        currentUserId={currentUserId}
        alertTimes={alertTimes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
  },
  todayButton: {
    marginTop: 4,
  },
});
