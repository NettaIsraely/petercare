import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarViewMode, TimelineEvent } from '../../types/events';
import { CalendarMarkedDates } from '../../utils/scheduleHelpers';
import { UserSummary } from '../../types/user';
import CalendarModeToggle from './CalendarModeToggle';
import UserColorLegend from './UserColorLegend';
import ScheduleWeeklyView from './ScheduleWeeklyView';
import ScheduleMonthlyView from './ScheduleMonthlyView';

interface ScheduleCalendarViewProps {
  calendarViewMode: CalendarViewMode;
  onCalendarViewModeChange: (mode: CalendarViewMode) => void;
  markedDates: CalendarMarkedDates;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedDateEvents: TimelineEvent[];
  weekEvents: Record<string, TimelineEvent[]>;
  users: UserSummary[];
  onEventPress: (event: TimelineEvent) => void;
  currentUserId?: string;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ScheduleCalendarView({
  calendarViewMode,
  onCalendarViewModeChange,
  markedDates,
  selectedDate,
  onSelectDate,
  selectedDateEvents,
  weekEvents,
  users,
  onEventPress,
  currentUserId,
  alertTimes,
}: ScheduleCalendarViewProps) {
  return (
    <View style={styles.container}>
      <CalendarModeToggle
        mode={calendarViewMode}
        onChange={onCalendarViewModeChange}
      />
      <UserColorLegend users={users} currentUserId={currentUserId} />

      {calendarViewMode === 'weekly' ? (
        <ScheduleWeeklyView
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          weekEvents={weekEvents}
          onEventPress={onEventPress}
          currentUserId={currentUserId}
          alertTimes={alertTimes}
        />
      ) : (
        <ScheduleMonthlyView
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          events={selectedDateEvents}
          onEventPress={onEventPress}
          currentUserId={currentUserId}
          alertTimes={alertTimes}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
