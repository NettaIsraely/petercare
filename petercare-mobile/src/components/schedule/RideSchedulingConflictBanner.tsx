import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import {
  formatConflictTimeRange,
  RideConflictDetails,
} from '../../utils/rideConflictHelpers';

interface RideSchedulingConflictBannerProps {
  conflicts: RideConflictDetails;
}

function ConflictSection({
  title,
  entries,
}: {
  title: string;
  entries: RideConflictDetails['horses'];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {entries.map((entry) => (
        <View key={`${entry.name}-${entry.start_time}-${entry.end_time}`} style={styles.entryRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.entryText}>
            <Text style={styles.entryName}>{entry.name}</Text>
            {' — '}
            {formatConflictTimeRange(entry.start_time, entry.end_time)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function RideSchedulingConflictBanner({
  conflicts,
}: RideSchedulingConflictBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <AlertTriangle size={20} color="#C0392B" />
        <Text style={styles.title}>Scheduling conflict</Text>
      </View>

      <ConflictSection title="These horses are already booked:" entries={conflicts.horses} />
      <ConflictSection title="These riders are already booked:" entries={conflicts.riders} />

      <Text style={styles.hint}>Change the times or pick other available horses.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#922B21',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#C0392B',
    fontWeight: '700',
  },
  entryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#2C3E50',
  },
  entryName: {
    fontWeight: '700',
    color: '#922B21',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7F8C8D',
  },
});
