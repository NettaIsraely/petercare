import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Route, Stethoscope } from 'lucide-react-native';
import { HorseHistoryEntry, formatHistoryDate } from '../../utils/horseHelpers';
import { formatTimeLabel } from '../../utils/dateHelpers';

interface HorseHistoryLogProps {
  rides: HorseHistoryEntry[];
  treatments: HorseHistoryEntry[];
}

function RideEntry({ entry }: { entry: Extract<HorseHistoryEntry, { kind: 'ride' }> }) {
  const ride = entry.data;
  return (
    <View style={styles.entry}>
      <View style={styles.iconContainer}>
        <Route size={20} color="#2C3E50" />
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle}>Ride</Text>
        <Text style={styles.entryMeta}>{formatHistoryDate(ride.date)}</Text>
        <Text style={styles.entryDetail}>
          {formatTimeLabel(ride.start_time)} – {formatTimeLabel(ride.end_time)}
        </Text>
        <Text style={styles.entryDetail}>Rider: {ride.primary_rider.name}</Text>
      </View>
    </View>
  );
}

function TreatmentEntry({
  entry,
}: {
  entry: Extract<HorseHistoryEntry, { kind: 'treatment' }>;
}) {
  const treatment = entry.data;
  const durationLabel =
    treatment.duration_minutes != null ? `${treatment.duration_minutes} min` : null;

  return (
    <View style={styles.entry}>
      <View style={styles.iconContainer}>
        <Stethoscope size={20} color="#2C3E50" />
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.entryTitle}>{treatment.name}</Text>
        <Text style={styles.entryMeta}>{formatHistoryDate(treatment.date)}</Text>
        <Text style={styles.entryDetail}>Caregiver: {treatment.user.name}</Text>
        {durationLabel ? (
          <Text style={styles.entryDetail}>Duration: {durationLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function HorseHistoryLog({ rides, treatments }: HorseHistoryLogProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ride History</Text>
      {rides.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No rides recorded.</Text>
        </View>
      ) : (
        rides.map((entry) =>
          entry.kind === 'ride' ? <RideEntry key={`ride-${entry.data.id}`} entry={entry} /> : null
        )
      )}

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Treatments</Text>
      {treatments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No treatments recorded.</Text>
        </View>
      ) : (
        treatments.map((entry) =>
          entry.kind === 'treatment' ? (
            <TreatmentEntry key={`treatment-${entry.data.id}`} entry={entry} />
          ) : null
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  emptyText: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  entry: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  entryMeta: {
    fontSize: 14,
    color: '#3498DB',
    marginBottom: 4,
  },
  entryDetail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
});
