// Pool History Component
// Visualizes dopamine pool trends over time with cross-titration insights

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 35 };

// ═══════════════════════════════════════════════════════════════
// POOL HISTORY CHART
// ═══════════════════════════════════════════════════════════════

export const PoolHistoryChart = ({ 
  poolHistory = [], 
  days = 14,
  showHabitCompletion = true,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  // Process data for the chart
  const chartData = useMemo(() => {
    // Get last N days
    const today = new Date();
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = poolHistory.find(h => h.date === dateStr);
      
      data.push({
        date: dateStr,
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        morningPool: dayData?.morningPool || 65,
        eveningPool: dayData?.eveningPool || 50,
        completionRate: dayData?.completionRate || 0,
        drainTotal: dayData?.drainTotal || 0,
        rechargeTotal: dayData?.rechargeTotal || 0,
      });
    }
    
    return data;
  }, [poolHistory, days]);
  
  // Calculate chart dimensions
  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  
  // Scale functions
  const xScale = (index) => CHART_PADDING.left + (index / (days - 1)) * chartInnerWidth;
  const yScale = (value) => CHART_PADDING.top + ((100 - value) / 100) * chartInnerHeight;
  
  // Generate path for pool level line
  const generatePath = (dataKey) => {
    if (chartData.length === 0) return '';
    
    const points = chartData.map((d, i) => ({
      x: xScale(i),
      y: yScale(d[dataKey]),
    }));
    
    // Create smooth curve using cubic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };
  
  // Generate area fill path
  const generateAreaPath = (dataKey) => {
    const linePath = generatePath(dataKey);
    if (!linePath) return '';
    
    const bottomY = CHART_PADDING.top + chartInnerHeight;
    const lastX = xScale(days - 1);
    const firstX = xScale(0);
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };
  
  // Calculate averages
  const avgMorning = chartData.reduce((sum, d) => sum + d.morningPool, 0) / chartData.length;
  const avgEvening = chartData.reduce((sum, d) => sum + d.eveningPool, 0) / chartData.length;
  const avgCompletion = chartData.reduce((sum, d) => sum + d.completionRate, 0) / chartData.length;
  
  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Pool Levels
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.text3 }]}>
          Last {days} days
        </Text>
      </View>
      
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="eveningGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.warning} stopOpacity="0.2" />
            <Stop offset="1" stopColor={colors.warning} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(value => (
          <React.Fragment key={value}>
            <Line
              x1={CHART_PADDING.left}
              y1={yScale(value)}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y2={yScale(value)}
              stroke={colors.bg3}
              strokeWidth={1}
              strokeDasharray={value === 50 ? "0" : "4,4"}
              opacity={value === 50 ? 0.5 : 0.3}
            />
            <SvgText
              x={CHART_PADDING.left - 8}
              y={yScale(value) + 4}
              fontSize={10}
              fill={colors.text3}
              textAnchor="end"
            >
              {value}%
            </SvgText>
          </React.Fragment>
        ))}
        
        {/* Area fills */}
        <Path
          d={generateAreaPath('morningPool')}
          fill="url(#morningGradient)"
        />
        
        {/* Lines */}
        <Path
          d={generatePath('morningPool')}
          stroke={colors.accent}
          strokeWidth={2.5}
          fill="none"
        />
        <Path
          d={generatePath('eveningPool')}
          stroke={colors.warning}
          strokeWidth={2}
          strokeDasharray="4,4"
          fill="none"
        />
        
        {/* Completion indicators */}
        {showHabitCompletion && chartData.map((d, i) => (
          d.completionRate >= 80 && (
            <Circle
              key={`complete-${i}`}
              cx={xScale(i)}
              cy={CHART_PADDING.top + chartInnerHeight + 12}
              r={3}
              fill={colors.success}
            />
          )
        ))}
        
        {/* Data points */}
        {chartData.map((d, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={xScale(i)}
              cy={yScale(d.morningPool)}
              r={selectedPoint === i ? 6 : 4}
              fill={colors.accent}
              onPress={() => setSelectedPoint(selectedPoint === i ? null : i)}
            />
            
            {/* Day labels */}
            {(i === 0 || i === days - 1 || i % 3 === 0) && (
              <SvgText
                x={xScale(i)}
                y={CHART_PADDING.top + chartInnerHeight + 20}
                fontSize={10}
                fill={colors.text3}
                textAnchor="middle"
              >
                {d.dayLabel}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.text2 }]}>
            Morning ({Math.round(avgMorning)}% avg)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.text2 }]}>
            Evening ({Math.round(avgEvening)}% avg)
          </Text>
        </View>
      </View>
      
      {/* Selected point tooltip */}
      {selectedPoint !== null && chartData[selectedPoint] && (
        <View style={[styles.tooltip, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.tooltipTitle, { color: colors.text }]}>
            {new Date(chartData[selectedPoint].date).toLocaleDateString('en-US', { 
              weekday: 'short', month: 'short', day: 'numeric' 
            })}
          </Text>
          <Text style={[styles.tooltipText, { color: colors.text2 }]}>
            Morning: {chartData[selectedPoint].morningPool}% → Evening: {chartData[selectedPoint].eveningPool}%
          </Text>
          <Text style={[styles.tooltipText, { color: colors.text3 }]}>
            Drain: {chartData[selectedPoint].drainTotal}% | Recharge: +{chartData[selectedPoint].rechargeTotal}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// CROSS-TITRATION CHART
// Tracks how drain app usage changes as habits strengthen
// ═══════════════════════════════════════════════════════════════

export const CrossTitrationChart = ({
  screenTimeHistory = [],
  habitCompletions = [],
  weeks = 8,
}) => {
  const { colors } = useTheme();
  
  // Process weekly data
  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Calculate weekly averages
      const weekScreenTime = screenTimeHistory.filter(d => {
        const date = new Date(d.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      const avgScreenTime = weekScreenTime.length > 0
        ? weekScreenTime.reduce((sum, d) => sum + (d.totalDrainMinutes || 0), 0) / weekScreenTime.length
        : 0;
      
      // Calculate habit consistency for this week
      const weekCompletions = habitCompletions.filter(c => {
        const date = new Date(c.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      const completionRate = weekCompletions.length > 0 
        ? (weekCompletions.filter(c => c.completed).length / weekCompletions.length) * 100
        : 0;
      
      data.push({
        weekLabel: `W${weeks - w}`,
        screenTimeMinutes: avgScreenTime,
        completionRate,
        weekStart: weekStart.toISOString().split('T')[0],
      });
    }
    
    return data;
  }, [screenTimeHistory, habitCompletions, weeks]);
  
  // Chart dimensions
  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  
  // Find max screen time for scaling
  const maxScreenTime = Math.max(...weeklyData.map(d => d.screenTimeMinutes), 120);
  
  // Scale functions
  const xScale = (index) => CHART_PADDING.left + (index / (weeks - 1)) * chartInnerWidth;
  const yScaleScreen = (value) => CHART_PADDING.top + ((maxScreenTime - value) / maxScreenTime) * chartInnerHeight;
  const yScaleCompletion = (value) => CHART_PADDING.top + ((100 - value) / 100) * chartInnerHeight;
  
  // Bar width
  const barWidth = (chartInnerWidth / weeks) * 0.6;
  
  // Calculate trend
  const firstWeekScreen = weeklyData[0]?.screenTimeMinutes || 0;
  const lastWeekScreen = weeklyData[weeks - 1]?.screenTimeMinutes || 0;
  const screenTrend = firstWeekScreen > 0 
    ? Math.round(((lastWeekScreen - firstWeekScreen) / firstWeekScreen) * 100)
    : 0;
  
  const firstWeekCompletion = weeklyData[0]?.completionRate || 0;
  const lastWeekCompletion = weeklyData[weeks - 1]?.completionRate || 0;
  const completionTrend = firstWeekCompletion > 0
    ? Math.round(((lastWeekCompletion - firstWeekCompletion) / firstWeekCompletion) * 100)
    : 0;
  
  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Cross-Titration
        </Text>
        <Text style={[styles.chartSubtitle, { color: colors.text3 }]}>
          Screen time vs habit consistency
        </Text>
      </View>
      
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {[0, 50, 100].map(value => (
          <Line
            key={value}
            x1={CHART_PADDING.left}
            y1={yScaleCompletion(value)}
            x2={CHART_WIDTH - CHART_PADDING.right}
            y2={yScaleCompletion(value)}
            stroke={colors.bg3}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.3}
          />
        ))}
        
        {/* Screen time bars */}
        {weeklyData.map((d, i) => (
          <Rect
            key={`bar-${i}`}
            x={xScale(i) - barWidth / 2}
            y={yScaleScreen(d.screenTimeMinutes)}
            width={barWidth}
            height={chartInnerHeight - (yScaleScreen(d.screenTimeMinutes) - CHART_PADDING.top)}
            rx={4}
            fill={colors.warning}
            opacity={0.6}
          />
        ))}
        
        {/* Completion line */}
        {weeklyData.length > 1 && (
          <Path
            d={weeklyData.map((d, i) => 
              `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleCompletion(d.completionRate)}`
            ).join(' ')}
            stroke={colors.success}
            strokeWidth={2.5}
            fill="none"
          />
        )}
        
        {/* Completion points */}
        {weeklyData.map((d, i) => (
          <Circle
            key={`point-${i}`}
            cx={xScale(i)}
            cy={yScaleCompletion(d.completionRate)}
            r={4}
            fill={colors.success}
          />
        ))}
        
        {/* Week labels */}
        {weeklyData.map((d, i) => (
          <SvgText
            key={`label-${i}`}
            x={xScale(i)}
            y={CHART_PADDING.top + chartInnerHeight + 18}
            fontSize={10}
            fill={colors.text3}
            textAnchor="middle"
          >
            {d.weekLabel}
          </SvgText>
        ))}
      </Svg>
      
      {/* Legend and trend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.text2 }]}>
            Drain apps
          </Text>
          {screenTrend !== 0 && (
            <Text style={[styles.trendText, { 
              color: screenTrend < 0 ? colors.success : colors.danger 
            }]}>
              {screenTrend > 0 ? '+' : ''}{screenTrend}%
            </Text>
          )}
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.text2 }]}>
            Habits
          </Text>
          {completionTrend !== 0 && (
            <Text style={[styles.trendText, { 
              color: completionTrend > 0 ? colors.success : colors.danger 
            }]}>
              {completionTrend > 0 ? '+' : ''}{completionTrend}%
            </Text>
          )}
        </View>
      </View>
      
      {/* Insight */}
      {screenTrend < -10 && completionTrend > 10 && (
        <View style={[styles.insightBox, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.insightText, { color: colors.success }]}>
            📉 As your habits strengthen, screen time is naturally decreasing.
            The cross-titration is working.
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// POOL INSIGHTS SUMMARY
// ═══════════════════════════════════════════════════════════════

export const PoolInsightsSummary = ({
  poolHistory = [],
  habits = [],
  completions = [],
}) => {
  const { colors } = useTheme();
  
  // Calculate insights
  const insights = useMemo(() => {
    if (poolHistory.length < 7) return null;
    
    const recent7Days = poolHistory.slice(-7);
    const previous7Days = poolHistory.slice(-14, -7);
    
    // Average morning pool
    const recentMorning = recent7Days.reduce((sum, d) => sum + (d.morningPool || 65), 0) / 7;
    const previousMorning = previous7Days.length > 0
      ? previous7Days.reduce((sum, d) => sum + (d.morningPool || 65), 0) / previous7Days.length
      : recentMorning;
    
    // Drain patterns
    const avgDrain = recent7Days.reduce((sum, d) => sum + (d.drainTotal || 0), 0) / 7;
    
    // Best/worst days
    const sortedByMorning = [...recent7Days].sort((a, b) => (b.morningPool || 0) - (a.morningPool || 0));
    const bestDay = sortedByMorning[0];
    const worstDay = sortedByMorning[sortedByMorning.length - 1];
    
    // Completion correlation
    const highPoolDays = recent7Days.filter(d => (d.morningPool || 65) >= 70);
    const highPoolCompletion = highPoolDays.length > 0
      ? highPoolDays.reduce((sum, d) => sum + (d.completionRate || 0), 0) / highPoolDays.length
      : 0;
    
    const lowPoolDays = recent7Days.filter(d => (d.morningPool || 65) < 50);
    const lowPoolCompletion = lowPoolDays.length > 0
      ? lowPoolDays.reduce((sum, d) => sum + (d.completionRate || 0), 0) / lowPoolDays.length
      : 0;
    
    return {
      morningTrend: recentMorning - previousMorning,
      avgMorning: recentMorning,
      avgDrain,
      bestDay,
      worstDay,
      highPoolCompletion,
      lowPoolCompletion,
      poolCompletionGap: highPoolCompletion - lowPoolCompletion,
    };
  }, [poolHistory]);
  
  if (!insights) {
    return (
      <View style={[styles.insightsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>
          Pool Insights
        </Text>
        <Text style={[styles.insightsEmpty, { color: colors.text3 }]}>
          Track for 7+ days to see insights
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.insightsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.insightsTitle, { color: colors.text }]}>
        Pool Insights
      </Text>
      
      <View style={styles.insightGrid}>
        {/* Morning trend */}
        <View style={[styles.insightCard, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.insightValue, { 
            color: insights.morningTrend > 0 ? colors.success : 
                   insights.morningTrend < -5 ? colors.warning : colors.text 
          }]}>
            {insights.morningTrend > 0 ? '+' : ''}{Math.round(insights.morningTrend)}%
          </Text>
          <Text style={[styles.insightLabel, { color: colors.text3 }]}>
            Morning trend
          </Text>
        </View>
        
        {/* Avg drain */}
        <View style={[styles.insightCard, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.insightValue, { color: colors.text }]}>
            {Math.round(insights.avgDrain)}%
          </Text>
          <Text style={[styles.insightLabel, { color: colors.text3 }]}>
            Daily drain
          </Text>
        </View>
        
        {/* Pool-completion gap */}
        <View style={[styles.insightCard, { backgroundColor: colors.bg2 }]}>
          <Text style={[styles.insightValue, { color: colors.accent }]}>
            +{Math.round(insights.poolCompletionGap)}%
          </Text>
          <Text style={[styles.insightLabel, { color: colors.text3 }]}>
            High pool boost
          </Text>
        </View>
      </View>
      
      {/* Observation */}
      {insights.poolCompletionGap > 20 && (
        <View style={[styles.observationBox, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.observationText, { color: colors.accent }]}>
            You complete {Math.round(insights.poolCompletionGap)}% more habits on high-pool days. 
            Protecting morning reserves matters.
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 12,
  },
  
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendBar: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Tooltip
  tooltip: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Insight boxes
  insightBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Insights summary
  insightsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  insightsEmpty: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  insightCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  insightLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  observationBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  observationText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default PoolHistoryChart;
