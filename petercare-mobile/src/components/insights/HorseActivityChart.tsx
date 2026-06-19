import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { HorseRideCount, WeekRange } from '../../utils/insightsHelpers';

interface HorseActivityChartProps {
  weekRange: WeekRange;
  horseRideCounts: HorseRideCount[];
}

const ROW_HEIGHT = 36;
const BAR_HEIGHT = 18;
const NAME_WIDTH = 96;
const COUNT_WIDTH = 28;
const HORIZONTAL_PADDING = 32;
const CARD_PADDING = 16;

export default function HorseActivityChart({
  weekRange,
  horseRideCounts,
}: HorseActivityChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - HORIZONTAL_PADDING * 2 - CARD_PADDING * 2;
  const barMaxWidth = chartWidth - NAME_WIDTH - COUNT_WIDTH - 8;
  const maxCount = Math.max(...horseRideCounts.map((item) => item.count), 1);
  const hasAnyRides = horseRideCounts.some((item) => item.count > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Horse Activity</Text>
      <Text style={styles.sectionSubtitle}>{weekRange.label}</Text>

      <View style={styles.card}>
        {horseRideCounts.length === 0 ? (
          <Text style={styles.emptyText}>No active horses found.</Text>
        ) : !hasAnyRides ? (
          <Text style={styles.emptyText}>No rides recorded this week.</Text>
        ) : (
          horseRideCounts.map((item) => {
            const barWidth =
              item.count > 0 ? Math.max((item.count / maxCount) * barMaxWidth, 8) : 0;

            return (
              <View key={item.horseId} style={styles.row}>
                <Text style={styles.horseName} numberOfLines={1}>
                  {item.horseName.length > 12
                    ? `${item.horseName.slice(0, 11)}…`
                    : item.horseName}
                </Text>
                <View style={styles.barContainer}>
                  <Svg width={barMaxWidth} height={BAR_HEIGHT}>
                    {barWidth > 0 && (
                      <Rect
                        x={0}
                        y={0}
                        width={barWidth}
                        height={BAR_HEIGHT}
                        fill="#3498DB"
                        rx={4}
                      />
                    )}
                  </Svg>
                </View>
                <Text style={styles.count}>{String(item.count)}</Text>
              </View>
            );
          })
        )}
      </View>
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
  },
  horseName: {
    width: NAME_WIDTH,
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  count: {
    width: COUNT_WIDTH,
    fontSize: 14,
    fontWeight: '700',
    color: '#3498DB',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
