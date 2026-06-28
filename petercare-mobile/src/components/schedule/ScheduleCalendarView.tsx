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
  weekOffset: number;
  weekAnchor: string;
  onWeekOffsetChange: (offset: number) => void;
  onJumpToToday: () => void;
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
  weekOffset,
  weekAnchor,
  onWeekOffsetChange,
  onJumpToToday,
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

      {calendarViewMode === 'weekly' ? (
        <ScheduleWeeklyView
          weekOffset={weekOffset}
          weekAnchor={weekAnchor}
          onWeekOffsetChange={onWeekOffsetChange}
          onJumpToToday={onJumpToToday}
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
          users={users}
        />
      )}

      <UserColorLegend users={users} currentUserId={currentUserId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
