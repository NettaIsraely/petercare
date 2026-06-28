import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Feeding } from '../../types/feeding';
import { Horse } from '../../types/horse';
import { Ride } from '../../types/ride';
import { Task } from '../../types/task';
import {
  computeHorseRideCounts,
  computePersonalChecklist,
  getWeekRangeForOffset,
} from '../../utils/insightsHelpers';
import HorseActivityChart from './HorseActivityChart';
import PersonalStatsChecklist from './PersonalStatsChecklist';
import JumpToTodayButton from '../shared/JumpToTodayButton';

const MIN_WEEK_OFFSET = -52;
const MAX_WEEK_OFFSET = 52;
const CENTER_INDEX = -MIN_WEEK_OFFSET;

const WEEK_OFFSETS = Array.from(
  { length: MAX_WEEK_OFFSET - MIN_WEEK_OFFSET + 1 },
  (_, index) => MIN_WEEK_OFFSET + index
);

function offsetToIndex(offset: number): number {
  return offset - MIN_WEEK_OFFSET;
}

interface CachedInsightsData {
  horses: Horse[];
  rides: Ride[];
  feedings: Feeding[];
  tasks: Task[];
}

interface InsightsWeekPagerProps {
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  weekRange: { start: string; end: string; label: string };
  cachedData: CachedInsightsData | null;
  userId: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function InsightsWeekPager({
  weekOffset,
  setWeekOffset,
  weekRange,
  cachedData,
  userId,
  refreshing,
  onRefresh,
}: InsightsWeekPagerProps) {
  const { width: pageWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<number>>(null);

  const scrollToOffset = useCallback(
    (offset: number, animated = true) => {
      const index = offsetToIndex(offset);
      listRef.current?.scrollToIndex({ index, animated });
      setWeekOffset(offset);
    },
    [setWeekOffset]
  );

  useEffect(() => {
    listRef.current?.scrollToIndex({
      index: offsetToIndex(weekOffset),
      animated: false,
    });
  }, [weekOffset, pageWidth]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      const clampedIndex = Math.max(0, Math.min(WEEK_OFFSETS.length - 1, index));
      setWeekOffset(WEEK_OFFSETS[clampedIndex]);
    },
    [pageWidth, setWeekOffset]
  );

  const handlePrevWeek = () => {
    if (weekOffset <= MIN_WEEK_OFFSET) {
      return;
    }
    scrollToOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    if (weekOffset >= MAX_WEEK_OFFSET) {
      return;
    }
    scrollToOffset(weekOffset + 1);
  };

  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  const renderWeekPage = useCallback(
    ({ item: offset }: { item: number }) => {
      const range = getWeekRangeForOffset(offset);
      const horseRideCounts = cachedData
        ? computeHorseRideCounts(cachedData.horses, cachedData.rides, range)
        : [];
      const personalChecklist = cachedData
        ? computePersonalChecklist(
            userId,
            cachedData.feedings,
            cachedData.tasks,
            range
          )
        : {
            feedings: [],
            tasks: [],
            summary: {
              feedingsComplete: 0,
              feedingsTotal: 0,
              tasksComplete: 0,
              tasksTotal: 0,
            },
          };

      return (
        <ScrollView
          style={{ width: pageWidth }}
          contentContainerStyle={styles.pageContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3498DB"
            />
          }
        >
          <HorseActivityChart weekRange={range} horseRideCounts={horseRideCounts} />
          <PersonalStatsChecklist
            checklist={personalChecklist}
            isCurrentWeek={offset === 0}
            weekLabel={range.label}
          />
        </ScrollView>
      );
    },
    [cachedData, userId, pageWidth, refreshing, onRefresh]
  );

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePrevWeek}
          disabled={weekOffset <= MIN_WEEK_OFFSET}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
        >
          <ChevronLeft
            size={20}
            color={weekOffset <= MIN_WEEK_OFFSET ? '#BDC3C7' : '#3498DB'}
          />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekRange.label}</Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextWeek}
          disabled={weekOffset >= MAX_WEEK_OFFSET}
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <ChevronRight
            size={20}
            color={weekOffset >= MAX_WEEK_OFFSET ? '#BDC3C7' : '#3498DB'}
          />
        </TouchableOpacity>
      </View>

      {weekOffset !== 0 ? (
        <JumpToTodayButton label="This week" onPress={() => scrollToOffset(0)} />
      ) : null}

      <FlatList
        ref={listRef}
        data={WEEK_OFFSETS}
        keyExtractor={(item) => String(item)}
        renderItem={renderWeekPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={CENTER_INDEX}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
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
    paddingHorizontal: 20,
    paddingTop: 20,
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
  pager: {
    flex: 1,
  },
  pageContent: {
    padding: 20,
    paddingBottom: 32,
  },
});
