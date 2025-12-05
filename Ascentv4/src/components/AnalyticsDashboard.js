// Analytics Dashboard Component
// Displays detailed behavioral insights and patterns

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Circle, Line, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { radius } from '../constants/theme';
import { generateAnalyticsReport } from '../services/analytics';

// ═══════════════════════════════════════════════════════════════
// KEY INSIGHTS CARD
// ═══════════════════════════════════════════════════════════════

export const KeyInsightsCard = ({ insights }) => {
  const { colors } = useTheme();
  
  if (!insights || insights.length === 0) {
    return null;
  }
  
  const iconColors = {
    time: colors.accent,
    day: colors.warning,
    pool: colors.purple,
    success: colors.success,
    attention: colors.warning,
  };
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        Key Insights
      </Text>
      
      {insights.map((insight, index) => (
        <View 
          key={index} 
          style={[
            styles.insightRow,
            index < insights.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.bg2 }
          ]}
        >
          <View style={[styles.insightIcon, { backgroundColor: `${iconColors[insight.type]}20` }]}>
            <Text style={{ fontSize: 18 }}>{insight.icon}</Text>
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              {insight.title}
            </Text>
            <Text style={[styles.insightMessage, { color: colors.text2 }]}>
              {insight.message}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// DAY OF WEEK CHART
// ═══════════════════════════════════════════════════════════════

export const DayOfWeekChart = ({ dayRates }) => {
  const { colors } = useTheme();
  
  if (!dayRates || dayRates.length === 0) {
    return null;
  }
  
  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 120;
  const BAR_WIDTH = 36;
  const BAR_GAP = 10;
  const MAX_BAR_HEIGHT = 80;
  
  const maxRate = Math.max(...dayRates.map(d => d.rate), 100);
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        Day Patterns
      </Text>
      
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {dayRates.map((day, i) => {
          const barHeight = (day.rate / maxRate) * MAX_BAR_HEIGHT;
          const x = i * (BAR_WIDTH + BAR_GAP) + 10;
          const y = MAX_BAR_HEIGHT - barHeight + 10;
          
          // Color based on rate
          const barColor = day.rate >= 80 ? colors.success :
                          day.rate >= 50 ? colors.warning : colors.text3;
          
          return (
            <React.Fragment key={i}>
              {/* Background bar */}
              <Rect
                x={x}
                y={10}
                width={BAR_WIDTH}
                height={MAX_BAR_HEIGHT}
                rx={6}
                fill={colors.bg2}
              />
              {/* Filled bar */}
              <Rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={6}
                fill={barColor}
              />
              {/* Day label */}
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - 5}
                fontSize={10}
                fill={colors.text3}
                textAnchor="middle"
              >
                {day.name.slice(0, 3)}
              </SvgText>
              {/* Rate label */}
              {barHeight > 20 && (
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={y + 15}
                  fontSize={11}
                  fill="#fff"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {day.rate}%
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// TIME OF DAY CHART
// ═══════════════════════════════════════════════════════════════

export const TimeOfDayChart = ({ windowRates, bestWindow }) => {
  const { colors } = useTheme();
  
  if (!windowRates) {
    return null;
  }
  
  const windows = [
    { key: 'morning', label: 'Morning', icon: '🌅', hours: '5-12' },
    { key: 'afternoon', label: 'Afternoon', icon: '☀️', hours: '12-17' },
    { key: 'evening', label: 'Evening', icon: '🌆', hours: '17-22' },
    { key: 'night', label: 'Night', icon: '🌙', hours: '22-5' },
  ];
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        Best Time to Act
      </Text>
      
      <View style={styles.timeGrid}>
        {windows.map(window => {
          const rate = windowRates[window.key] || 0;
          const isBest = bestWindow?.name === window.key;
          
          return (
            <View 
              key={window.key}
              style={[
                styles.timeCell,
                { backgroundColor: colors.bg2 },
                isBest && { borderWidth: 2, borderColor: colors.success }
              ]}
            >
              <Text style={{ fontSize: 20 }}>{window.icon}</Text>
              <Text style={[styles.timeCellLabel, { color: colors.text }]}>
                {window.label}
              </Text>
              <Text style={[
                styles.timeCellRate, 
                { color: rate >= 80 ? colors.success : rate >= 50 ? colors.warning : colors.text3 }
              ]}>
                {Math.round(rate)}%
              </Text>
              {isBest && (
                <View style={[styles.bestBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.bestBadgeText, { color: colors.success }]}>
                    Best
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// HABIT PERFORMANCE CARDS
// ═══════════════════════════════════════════════════════════════

export const HabitPerformanceCard = ({ habitAnalytics }) => {
  const { colors } = useTheme();
  
  const validHabits = habitAnalytics?.filter(h => h.hasEnoughData) || [];
  
  if (validHabits.length === 0) {
    return null;
  }
  
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving': return { icon: 'trending-up', color: colors.success };
      case 'declining': return { icon: 'trending-down', color: colors.danger };
      default: return { icon: 'remove', color: colors.text3 };
    }
  };
  
  const getResistanceColor = (level) => {
    switch (level) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.danger;
      default: return colors.text3;
    }
  };
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        Habit Performance
      </Text>
      
      {validHabits.map((habit, index) => {
        const trend = getTrendIcon(habit.trendDirection);
        
        return (
          <View 
            key={habit.habitId}
            style={[
              styles.habitRow,
              index < validHabits.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.bg2 }
            ]}
          >
            <View style={styles.habitInfo}>
              <Text style={[styles.habitName, { color: colors.text }]}>
                {habit.habitName}
              </Text>
              <View style={styles.habitMeta}>
                <View style={[styles.resistanceBadge, { backgroundColor: `${getResistanceColor(habit.resistanceLevel)}20` }]}>
                  <Text style={[styles.resistanceText, { color: getResistanceColor(habit.resistanceLevel) }]}>
                    {habit.resistanceLevel} resistance
                  </Text>
                </View>
                {habit.isSticky && (
                  <View style={[styles.stickyBadge, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.stickyText, { color: colors.success }]}>
                      ✓ Sticky
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.habitStats}>
              <View style={styles.habitStat}>
                <Text style={[styles.habitStatValue, { color: colors.text }]}>
                  {habit.weekRate}%
                </Text>
                <Text style={[styles.habitStatLabel, { color: colors.text3 }]}>
                  7d
                </Text>
              </View>
              <View style={styles.habitStat}>
                <Ionicons name={trend.icon} size={20} color={trend.color} />
                <Text style={[styles.habitStatLabel, { color: trend.color }]}>
                  {habit.trend > 0 ? '+' : ''}{habit.trend}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// POOL CORRELATION CARD
// ═══════════════════════════════════════════════════════════════

export const PoolCorrelationCard = ({ poolCorrelation }) => {
  const { colors } = useTheme();
  
  if (!poolCorrelation?.hasEnoughData) {
    return null;
  }
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        Pool Impact
      </Text>
      
      <View style={styles.poolCompare}>
        <View style={[styles.poolCompareItem, { backgroundColor: colors.bg2 }]}>
          <View style={[styles.poolDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.poolCompareLabel, { color: colors.text3 }]}>
            High Pool Days
          </Text>
          <Text style={[styles.poolCompareValue, { color: colors.text }]}>
            {poolCorrelation.highPoolCompletion}%
          </Text>
        </View>
        
        <View style={[styles.poolCompareItem, { backgroundColor: colors.bg2 }]}>
          <View style={[styles.poolDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.poolCompareLabel, { color: colors.text3 }]}>
            Low Pool Days
          </Text>
          <Text style={[styles.poolCompareValue, { color: colors.text }]}>
            {poolCorrelation.lowPoolCompletion}%
          </Text>
        </View>
      </View>
      
      <View style={[styles.impactBox, { 
        backgroundColor: poolCorrelation.poolMatters ? colors.successLight : colors.bg2 
      }]}>
        <Text style={[styles.impactText, { 
          color: poolCorrelation.poolMatters ? colors.success : colors.text2 
        }]}>
          {poolCorrelation.insight}
        </Text>
      </View>
      
      <View style={styles.correlationBadge}>
        <Text style={[styles.correlationLabel, { color: colors.text3 }]}>
          Correlation: {poolCorrelation.correlationStrength}
        </Text>
        <Text style={[styles.correlationValue, { color: colors.text2 }]}>
          r = {poolCorrelation.correlation}
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// FULL ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════

export const AnalyticsDashboard = ({ data }) => {
  const { colors } = useTheme();
  
  const report = useMemo(() => {
    return generateAnalyticsReport(data);
  }, [data.completions, data.habits, data.poolHistory]);
  
  const hasEnoughData = report.summary.totalDays >= 7;
  
  if (!hasEnoughData) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
        <Ionicons name="analytics-outline" size={40} color={colors.text3} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Building Your Insights
        </Text>
        <Text style={[styles.emptyText, { color: colors.text3 }]}>
          Track for 7+ days to unlock detailed analytics and pattern detection.
        </Text>
        <View style={[styles.progressIndicator, { backgroundColor: colors.bg2 }]}>
          <View style={[
            styles.progressFill, 
            { 
              backgroundColor: colors.accent,
              width: `${Math.min(100, (report.summary.totalDays / 7) * 100)}%`
            }
          ]} />
        </View>
        <Text style={[styles.progressText, { color: colors.text3 }]}>
          {report.summary.totalDays}/7 days
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.dashboard}>
      {/* Summary Stats */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Your Journey
        </Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryItem, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              {report.summary.totalCompletions}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.text3 }]}>
              Total Completions
            </Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {report.summary.stickyHabitsCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.text3 }]}>
              Sticky Habits
            </Text>
          </View>
          <View style={[styles.summaryItem, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {report.summary.avgCompletionsPerDay}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.text3 }]}>
              Avg/Day
            </Text>
          </View>
        </View>
      </View>
      
      {/* Key Insights */}
      <KeyInsightsCard insights={report.keyInsights} />
      
      {/* Time Patterns */}
      <TimeOfDayChart 
        windowRates={report.timePatterns.windowRates}
        bestWindow={report.timePatterns.bestWindow}
      />
      
      {/* Day Patterns */}
      <DayOfWeekChart dayRates={report.dayPatterns.dayRates} />
      
      {/* Pool Correlation */}
      <PoolCorrelationCard poolCorrelation={report.poolCorrelation} />
      
      {/* Habit Performance */}
      <HabitPerformanceCard habitAnalytics={report.habitAnalytics} />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  dashboard: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  
  // Insights
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCell: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  timeCellLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  timeCellRate: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  bestBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Habit performance
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  resistanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resistanceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  stickyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stickyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  habitStats: {
    flexDirection: 'row',
    gap: 16,
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  habitStatLabel: {
    fontSize: 10,
  },
  
  // Pool correlation
  poolCompare: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  poolCompareItem: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  poolDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  poolCompareLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  poolCompareValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  impactBox: {
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  impactText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  correlationBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  correlationLabel: {
    fontSize: 12,
  },
  correlationValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Empty state
  emptyCard: {
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressIndicator: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
  },
});

export default AnalyticsDashboard;
