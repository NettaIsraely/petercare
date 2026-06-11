import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Wheat, Route, Stethoscope, ClipboardList } from 'lucide-react-native';
import { ScheduleSectionData, TimelineEvent } from '../../types/events';
import ScheduleSection, { DatelessTasksSection } from './ScheduleSection';

interface ScheduleListViewProps {
  sections: ScheduleSectionData;
  onEventPress: (event: TimelineEvent) => void;
  alertTimes?: {
    morningTime?: string;
    eveningTime?: string;
  };
}

export default function ScheduleListView({
  sections,
  onEventPress,
  alertTimes,
}: ScheduleListViewProps) {
  return (
    <View style={styles.container}>
      <ScheduleSection
        title="Feedings"
        icon={Wheat}
        events={sections.feedings}
        onEventPress={onEventPress}
        alertTimes={alertTimes}
        emptyMessage="No feedings scheduled."
      />
      <ScheduleSection
        title="Rides"
        icon={Route}
        events={sections.rides}
        onEventPress={onEventPress}
        alertTimes={alertTimes}
        emptyMessage="No rides scheduled."
      />
      <ScheduleSection
        title="Treatments"
        icon={Stethoscope}
        events={sections.treatments}
        onEventPress={onEventPress}
        alertTimes={alertTimes}
        emptyMessage="No treatments scheduled."
      />
      <ScheduleSection
        title="Tasks"
        icon={ClipboardList}
        events={sections.tasksWithDeadlines}
        onEventPress={onEventPress}
        alertTimes={alertTimes}
        emptyMessage="No tasks with deadlines."
      />
      <DatelessTasksSection
        tasks={sections.datelessTasks}
        onTaskPress={onEventPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
