import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
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
  const chartHeight = Math.max(horseRideCounts.length * ROW_HEIGHT, ROW_HEIGHT);

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
          <Svg width={chartWidth} height={chartHeight}>
            {horseRideCounts.map((item, index) => {
              const y = index * ROW_HEIGHT;
              const barWidth =
                item.count > 0
                  ? Math.max((item.count / maxCount) * barMaxWidth, 8)
                  : 0;

              return (
                <React.Fragment key={item.horseId}>
                  <SvgText
                    x={0}
                    y={y + ROW_HEIGHT / 2 + 5}
                    fontSize={14}
                    fontWeight="500"
                    fill="#2C3E50"
                  >
                    {item.horseName.length > 12
                      ? `${item.horseName.slice(0, 11)}…`
                      : item.horseName}
                  </SvgText>
                  <Rect
                    x={NAME_WIDTH}
                    y={y + (ROW_HEIGHT - BAR_HEIGHT) / 2}
                    width={barWidth}
                    height={BAR_HEIGHT}
                    fill="#3498DB"
                    rx={4}
                  />
                  <SvgText
                    x={chartWidth - COUNT_WIDTH}
                    y={y + ROW_HEIGHT / 2 + 5}
                    fontSize={14}
                    fontWeight="700"
                    fill="#3498DB"
                  >
                    {String(item.count)}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
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
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
