import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { radius, shadows, QUOTES, MILESTONES, lightColors as staticColors, spacing } from '../constants/theme';
import { 
  isHabitCompletedToday, calculateHabitStreak, 
  calculateOverallStreak, getTodayStr 
} from '../services/storage';
import { chatWithCoach } from '../services/ai';
import { Ionicons } from '@expo/vector-icons';

// New imports for dopamine pool system
import { 
  calculateCurrentPool, 
  calculateMorningPool, 
  getPoolStatusMessage,
  logDrainActivity,
  logRechargeActivity,
} from '../services/dopaminePool';
import { 
  getCompletionReward, 
  shouldShowReward,
  checkMilestone,
  getCelebrationType,
} from '../services/rewards';
import { 
  checkForInsights, 
  markInsightShown,
} from '../services/insightEngine';
import { 
  calculateResilientStreak,
  calculateOverallResilientStreak,
  getMissRecoveryInfo,
} from '../services/streakCalculator';

import Mountain from '../components/Mountain';
import DailyRing from '../components/DailyRing';
import Heatmap from '../components/Heatmap';
import { TaskCard, HabitCard, QuoteCard } from '../components/Cards';
import AddHabitModal from '../components/AddHabitModal';

// New components
import { DopamineVessel, PoolInfoContent } from '../components/DopamineVessel';
import { RewardToast, InsightBanner } from '../components/RewardToast';
import { MissRecoveryModal, LowPoolGuidance, StreakAtRiskBanner } from '../components/MissRecoveryModal';
import { LogActivityModal } from '../components/LogActivityModal';
import { LogActivityModal } from '../components/LogActivityModal';

// Updated tabs - Trends between Today and Coach
const TABS = ['today', 'trends', 'coach', 'plan', 'profile'];
const TAB_ICONS = {
  today: 'sunny',
  trends: 'stats-chart',
  coach: 'chatbubble-ellipses',
  plan: 'map',
  profile: 'person',
};

export default function MainScreen({ data, setData, saveData }) {
  const [activeTab, setActiveTab] = useState('today');
  const [chatMessages, setChatMessages] = useState(data.chatMessages || []);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [show60DaysInfo, setShow60DaysInfo] = useState(false);
  const [showMilestone, setShowMilestone] = useState(null);
  const [showWeekPlan, setShowWeekPlan] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Dopamine Pool & Reward System State
  // ═══════════════════════════════════════════════════════════════
  const [poolLevel, setPoolLevel] = useState(data.poolData?.currentLevel || 65);
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardContext, setRewardContext] = useState({});
  const [proactiveInsight, setProactiveInsight] = useState(null);
  const [showMissRecovery, setShowMissRecovery] = useState(false);
  const [missRecoveryInfo, setMissRecoveryInfo] = useState(null);
  const [showLogActivity, setShowLogActivity] = useState(false);
  
  // Theme hook for dark mode
  const { colors, shadows: themeShadows, isDark } = useTheme();
  const haptics = useHaptics();
  
  const chatScrollRef = useRef(null);
  
  const today = new Date();
  const todayStr = getTodayStr();
  const dayOfWeek = today.getDay();
  
  // Calculate progress
  const todayHabitsDone = data.habits.filter(h => 
    isHabitCompletedToday(data.completions, h.id)
  ).length;
  
  const todayTaskId = `week${data.currentWeek}-day${dayOfWeek}`;
  const todayTask = data.dailyTasks?.[dayOfWeek];
  const todayTaskDone = data.taskCompletions?.includes(todayTaskId);
  
  const totalItems = data.habits.length + (data.dailyTasks?.length > 0 ? 1 : 0);
  const completedItems = todayHabitsDone + (todayTaskDone ? 1 : 0);
  const dayProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  const streak = calculateOverallStreak(data.habits, data.completions);
  
  // Daily quote
  const dailyQuote = QUOTES[today.getDate() % QUOTES.length];
  
  // Current milestone
  let currentMilestone = "Complete your tasks";
  if (data.curriculum) {
    for (const phase of data.curriculum.phases) {
      const week = phase.weeks.find(w => w.week === data.currentWeek);
      if (week) {
        currentMilestone = week.milestone;
        break;
      }
    }
  }
  
  // Update streak in data
  useEffect(() => {
    if (data.streakDays !== streak) {
      setData(prev => ({ ...prev, streakDays: streak }));
      saveData({ ...data, streakDays: streak });
      
      // Check milestones
      for (const m of MILESTONES) {
        if (streak >= m.day && !data.unlockedMilestones?.includes(m.day)) {
          setShowMilestone(m);
          setData(prev => ({
            ...prev,
            unlockedMilestones: [...(prev.unlockedMilestones || []), m.day]
          }));
          break;
        }
      }
    }
  }, [streak]);
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Initialize Pool and Check for Insights/Recovery on mount
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Initialize or update pool for new day
    const today = new Date().toISOString().split('T')[0];
    const lastPoolUpdate = data.poolData?.lastUpdated?.split('T')[0];
    
    if (lastPoolUpdate !== today) {
      // New day - calculate morning pool
      const morningLevel = calculateMorningPool({
        yesterdayComplete: dayProgress === 100,
        streakDays: data.streakDays || 0,
        lastSleepHours: data.lastSleepHours,
      });
      
      const newPoolData = {
        ...data.poolData,
        currentLevel: morningLevel,
        morningLevel: morningLevel,
        lastUpdated: new Date().toISOString(),
        drainActivities: [],
        rechargeActivities: [],
      };
      
      setPoolLevel(morningLevel);
      setData(prev => ({ ...prev, poolData: newPoolData }));
      saveData({ ...data, poolData: newPoolData });
    } else {
      setPoolLevel(data.poolData?.currentLevel || 65);
    }
    
    // Check for proactive insights
    const insight = checkForInsights(data, data.lastShownInsights || {});
    if (insight) {
      setProactiveInsight(insight);
    }
    
    // Check for miss recovery (returning after missing days)
    const recovery = getMissRecoveryInfo(data.completions, data.habits);
    if (recovery && !data.hasSeenMissRecovery) {
      setMissRecoveryInfo(recovery);
      setShowMissRecovery(true);
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Calculate resilient streaks
  // ═══════════════════════════════════════════════════════════════
  const overallStreakData = useMemo(() => {
    return calculateOverallResilientStreak(data.habits, data.completions);
  }, [data.habits, data.completions]);
  
  // Check if any habits are at risk (evening, incomplete)
  const incompleteHabits = useMemo(() => {
    return data.habits.filter(h => !isHabitCompletedToday(data.completions, h.id));
  }, [data.habits, data.completions]);
  
  const isEvening = new Date().getHours() >= 20;
  const streakAtRisk = isEvening && incompleteHabits.length > 0 && streak >= 3;
  
  // Habit completion with variable rewards
  const toggleHabit = (habitId) => {
    const isCompleted = isHabitCompletedToday(data.completions, habitId);
    let newCompletions;
    
    if (isCompleted) {
      // Uncompleting
      newCompletions = data.completions.filter(c => 
        !(c.odHabitId === habitId && new Date(c.date).toDateString() === todayStr)
      );
      haptics.select();
    } else {
      // Completing - trigger variable reward
      newCompletions = [
        ...data.completions,
        { odHabitId: habitId, date: new Date().toISOString(), completed: true }
      ];
      
      // Variable celebration haptic
      haptics.celebration();
      
      // Show variable reward toast
      const habit = data.habits.find(h => h.id === habitId);
      const habitStreak = calculateResilientStreak(data.completions, habitId);
      
      if (shouldShowReward({ 
        completionsToday: todayHabitsDone + 1,
        totalCompletions: data.completions?.length || 0,
      })) {
        setRewardContext({
          habitName: habit?.name || 'habit',
          streak: habitStreak.currentRun,
          recentRewards: data.recentRewards || [],
        });
        setShowRewardToast(true);
      }
      
      // Check for milestone
      const newStreak = calculateOverallStreak(data.habits, newCompletions);
      const milestone = checkMilestone(newStreak, data.unlockedMilestones || []);
      if (milestone) {
        haptics.milestone();
        setTimeout(() => setShowMilestone(milestone), 500);
      }
    }
    
    const updated = { ...data, completions: newCompletions };
    setData(updated);
    saveData(updated);
  };
  
  // Task completion with variable rewards
  const toggleTask = () => {
    let newTaskCompletions;
    if (todayTaskDone) {
      newTaskCompletions = data.taskCompletions.filter(t => t !== todayTaskId);
      haptics.select();
    } else {
      newTaskCompletions = [...(data.taskCompletions || []), todayTaskId];
      // Variable celebration haptic
      haptics.celebration();
      
      // Show reward toast for task completion
      if (shouldShowReward({ completionsToday: todayHabitsDone + 1 })) {
        setRewardContext({
          habitName: 'task',
          streak: streak,
          recentRewards: data.recentRewards || [],
        });
        setShowRewardToast(true);
      }
    }
    
    const updated = { ...data, taskCompletions: newTaskCompletions };
    setData(updated);
    saveData(updated);
  };
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Pool Activity Handlers
  // ═══════════════════════════════════════════════════════════════
  const handleLogRecharge = (activity) => {
    const newLevel = Math.min(100, poolLevel + activity.boost);
    setPoolLevel(newLevel);
    
    const newPoolData = {
      ...data.poolData,
      currentLevel: newLevel,
      lastUpdated: new Date().toISOString(),
      rechargeActivities: [
        ...(data.poolData?.rechargeActivities || []),
        activity,
      ],
    };
    
    setData(prev => ({ ...prev, poolData: newPoolData }));
    saveData({ ...data, poolData: newPoolData });
    
    haptics.poolRecharge();
  };
  
  const handleLogDrain = (activity) => {
    const newLevel = Math.max(0, poolLevel + activity.impact);
    setPoolLevel(newLevel);
    
    const newPoolData = {
      ...data.poolData,
      currentLevel: newLevel,
      lastUpdated: new Date().toISOString(),
      drainActivities: [
        ...(data.poolData?.drainActivities || []),
        activity,
      ],
    };
    
    setData(prev => ({ ...prev, poolData: newPoolData }));
    saveData({ ...data, poolData: newPoolData });
  };
  
  // Add habit
  const handleAddHabit = (habitData) => {
    const habit = {
      id: Date.now().toString(),
      name: habitData.name,
      amount: habitData.goalAmount,
      unit: habitData.unit,
    };
    
    const updated = { ...data, habits: [...data.habits, habit] };
    setData(updated);
    saveData(updated);
  };
  
  // Delete habit
  const deleteHabit = (habitId) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = {
              ...data,
              habits: data.habits.filter(h => h.id !== habitId),
              completions: data.completions.filter(c => c.odHabitId !== habitId),
            };
            setData(updated);
            saveData(updated);
          }
        }
      ]
    );
  };
  
  // Chat with pool-aware context
  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    
    try {
      // Enhanced data with pool and consistency context
      const enhancedData = {
        ...data,
        poolData: { currentLevel: poolLevel },
        consistencyScore: overallStreakData.consistencyScore,
        perfectDays: overallStreakData.perfectDays,
      };
      
      const response = await chatWithCoach(newMessages, enhancedData);
      const assistantMessage = { role: 'assistant', content: response };
      const finalMessages = [...newMessages, assistantMessage];
      setChatMessages(finalMessages);
      
      const updated = { ...data, chatMessages: finalMessages };
      setData(updated);
      saveData(updated);
    } catch (error) {
      console.error('Chat error:', error);
    }
    
    setChatLoading(false);
  };
  
  const handleSuggestion = (text) => {
    setChatInput(text);
  };
  
  // Format date
  const formatDate = () => {
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // ═══════════════════════════════════════════════════════════════
  // TODAY TAB - With Dopamine Pool at top
  // ═══════════════════════════════════════════════════════════════
  const renderTodayTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Proactive Insight Banner */}
      {proactiveInsight && (
        <InsightBanner
          insight={proactiveInsight}
          onDismiss={() => {
            const updated = markInsightShown(proactiveInsight.id, data.lastShownInsights || {});
            setData(prev => ({ ...prev, lastShownInsights: updated }));
            saveData({ ...data, lastShownInsights: updated });
            setProactiveInsight(null);
          }}
          onAction={(action) => {
            if (action.type === 'navigate' && action.target === 'coach') {
              setActiveTab('coach');
            }
          }}
        />
      )}
      
      {/* Streak at Risk Banner (evening only) */}
      {streakAtRisk && (
        <StreakAtRiskBanner
          visible={true}
          incompleteCount={incompleteHabits.length}
          onShowTwoMin={() => {
            // Could trigger 2-min mode for all habits
            haptics.warning();
          }}
          colors={colors}
        />
      )}
      
      {/* Dopamine Pool - THE KEY VISUAL */}
      {data.showDopaminePool !== false && (
        <DopamineVessel
          level={poolLevel}
          onInfoPress={() => setShowPoolInfo(true)}
          onLogActivity={() => setShowLogActivity(true)}
          showBreakdown={false}
        />
      )}
      
      {/* Low Pool Guidance */}
      <LowPoolGuidance poolLevel={poolLevel} colors={colors} />
      
      {/* Goal card */}
      <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.goalLabel, { color: colors.accent }]}>🎯 YOUR GOAL</Text>
        <Text style={[styles.goalText, { color: colors.text }]}>{data.goal || 'Not set yet'}</Text>
        <View style={[styles.dayBadge, { borderTopColor: colors.bg2 }]}>
          <View style={styles.dayBadgeContent}>
            <Text style={[styles.dayBadgeText, { color: colors.text2 }]}>
              Day {data.streakDays || streak} of 60
            </Text>
            {overallStreakData.status === 'solid' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                  {overallStreakData.consistencyScore}% consistency
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.infoBtn}
            onPress={() => setShow60DaysInfo(true)}
          >
            <Ionicons name="information-circle" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Compact Daily Ring */}
      <DailyRing
        progress={dayProgress}
        completedItems={completedItems}
        totalItems={totalItems}
        streak={data.streakDays || streak}
      />
      
      {/* Today's Task */}
      {todayTask && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Task</Text>
            <TouchableOpacity onPress={() => setActiveTab('plan')}>
              <Text style={[styles.sectionAction, { color: colors.accent }]}>View Plan →</Text>
            </TouchableOpacity>
          </View>
          <TaskCard
            task={todayTask.task}
            weekNum={data.currentWeek}
            completed={todayTaskDone}
            onComplete={toggleTask}
            taskId={todayTaskId}
          />
        </>
      )}
      
      {/* Habits */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Habits</Text>
        <TouchableOpacity onPress={() => setShowAddHabit(true)}>
          <Text style={[styles.sectionAction, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      </View>
      
      {data.habits.length === 0 ? (
        <View style={[styles.emptyHabits, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.text3 }]}>No habits yet</Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddHabit(true)}>
            <Ionicons name="add" size={20} color={colors.accent} />
            <Text style={[styles.addFirstText, { color: colors.accent }]}>Add your first habit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        data.habits.map(habit => {
          const habitStreakData = calculateResilientStreak(data.completions, habit.id);
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={isHabitCompletedToday(data.completions, habit.id)}
              streak={habitStreakData.currentRun}
              streakStatus={habitStreakData.status}
              streakColor={habitStreakData.color}
              onComplete={() => toggleHabit(habit.id)}
              onDelete={() => deleteHabit(habit.id)}
              poolLevel={poolLevel}
            />
          );
        })
      )}
      
      {/* Quote at bottom */}
      <View style={{ marginTop: 24 }}>
        <QuoteCard text={dailyQuote.text} author={dailyQuote.author} />
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
  
  // ═══════════════════════════════════════════════════════════════
  // TRENDS TAB - Enhanced with Resilient Streaks
  // ═══════════════════════════════════════════════════════════════
  const renderTrendsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Resilient Streak Overview */}
      <View style={[styles.consistencyCard, { backgroundColor: colors.card }]}>
        <View style={styles.consistencyHeader}>
          <Text style={[styles.consistencyTitle, { color: colors.text }]}>
            30-Day Consistency
          </Text>
          <View style={[
            styles.consistencyBadge, 
            { backgroundColor: overallStreakData.color + '20' }
          ]}>
            <Text style={[styles.consistencyBadgeText, { color: overallStreakData.color }]}>
              {overallStreakData.status === 'solid' ? 'Solid' : 
               overallStreakData.status === 'amber' ? 'Building' : 'Rebuilding'}
            </Text>
          </View>
        </View>
        
        <View style={styles.consistencyStats}>
          <View style={styles.consistencyStat}>
            <Text style={[styles.consistencyNumber, { color: overallStreakData.color }]}>
              {overallStreakData.consistencyScore}%
            </Text>
            <Text style={[styles.consistencyLabel, { color: colors.text3 }]}>
              Consistency
            </Text>
          </View>
          <View style={[styles.consistencyDivider, { backgroundColor: colors.bg2 }]} />
          <View style={styles.consistencyStat}>
            <Text style={[styles.consistencyNumber, { color: colors.text }]}>
              {overallStreakData.currentRun}
            </Text>
            <Text style={[styles.consistencyLabel, { color: colors.text3 }]}>
              Current run
            </Text>
          </View>
          <View style={[styles.consistencyDivider, { backgroundColor: colors.bg2 }]} />
          <View style={styles.consistencyStat}>
            <Text style={[styles.consistencyNumber, { color: colors.text }]}>
              {overallStreakData.perfectDays || 0}
            </Text>
            <Text style={[styles.consistencyLabel, { color: colors.text3 }]}>
              Perfect days
            </Text>
          </View>
        </View>
        
        <Text style={[styles.consistencyMessage, { color: colors.text2 }]}>
          {overallStreakData.message}
        </Text>
      </View>
      
      {/* Mountain visualization */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Journey</Text>
      </View>
      <Mountain 
        streak={data.streakDays || streak} 
        goal={data.goal} 
        todayComplete={dayProgress === 100}
        onInfoPress={() => setShow60DaysInfo(true)}
      />
      
      {/* Monthly Activity */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Activity</Text>
      </View>
      <Heatmap 
        habits={data.habits} 
        completions={data.completions}
      />
      
      {/* Per-habit stats */}
      {data.habits.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Habit Breakdown</Text>
          </View>
          {data.habits.map(habit => {
            const habitStreak = calculateResilientStreak(data.completions, habit.id);
            return (
              <View 
                key={habit.id} 
                style={[styles.habitStatCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.habitStatHeader}>
                  <Text style={[styles.habitStatName, { color: colors.text }]}>
                    {habit.name}
                  </Text>
                  <View style={[
                    styles.miniStatusBadge, 
                    { backgroundColor: habitStreak.color + '20' }
                  ]}>
                    <View style={[styles.miniStatusDot, { backgroundColor: habitStreak.color }]} />
                    <Text style={[styles.miniStatusText, { color: habitStreak.color }]}>
                      {habitStreak.consistencyScore}%
                    </Text>
                  </View>
                </View>
                <View style={styles.habitStatRow}>
                  <Text style={[styles.habitStatLabel, { color: colors.text3 }]}>
                    {habitStreak.currentRun} day run • Best: {habitStreak.bestRun} days
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      )}
      
      {/* Legacy stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{data.habits.length}</Text>
          <Text style={[styles.statLabel, { color: colors.text3 }]}>Active Habits</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{data.completions?.length || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.text3 }]}>Total Done</Text>
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
  
  // ═══════════════════════════════════════════════════════════════
  // COACH TAB
  // ═══════════════════════════════════════════════════════════════
  const renderCoachTab = () => (
    <KeyboardAvoidingView 
      style={styles.coachContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.coachHeader}>
        <View style={styles.coachAvatar}>
          <Ionicons name="sparkles" size={20} color={colors.purple} />
        </View>
        <View>
          <Text style={styles.coachName}>AI Coach</Text>
          <View style={styles.coachStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Powered by Claude</Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        ref={chatScrollRef}
        style={styles.coachMessages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => chatScrollRef.current?.scrollToEnd()}
      >
        {chatMessages.length === 0 ? (
          <>
            <View style={styles.welcomeBox}>
              <Text style={styles.welcomeIcon}>👋</Text>
              <Text style={styles.welcomeTitle}>Hey! I'm your AI coach</Text>
              <Text style={styles.welcomeText}>
                I know your habits, your streaks, and your current energy level. Ask me anything about building consistency.
              </Text>
            </View>
            
            {/* Pool-aware context */}
            <View style={[styles.coachContext, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.coachContextTitle, { color: colors.text3 }]}>
                Right now:
              </Text>
              <Text style={[styles.coachContextText, { color: colors.text2 }]}>
                Drive pool at {poolLevel}% • {overallStreakData.consistencyScore}% consistency over 30 days
              </Text>
            </View>
            
            <View style={styles.suggestions}>
              {/* Dynamic suggestions based on context */}
              {[
                poolLevel < 40 
                  ? "My energy is low today. What should I do?"
                  : "I'm struggling with motivation today",
                incompleteHabits.length > 0 
                  ? `Help me complete ${incompleteHabits[0]?.name || 'my habits'}`
                  : "Help me build a new habit",
                overallStreakData.status !== 'solid'
                  ? "How do I get more consistent?"
                  : "I keep breaking my streak",
                "What's my 2-minute version?",
              ].map((s, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.suggestionChip, { backgroundColor: colors.bg2 }]}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          chatMessages.map((m, i) => (
            <View key={i} style={[styles.message, m.role === 'user' && styles.messageUser]}>
              {m.role === 'assistant' && (
                <View style={styles.messageAvatar}>
                  <Ionicons name="sparkles" size={14} color={colors.purple} />
                </View>
              )}
              <View style={[styles.messageBubble, m.role === 'user' && styles.bubbleUser]}>
                <Text style={[styles.messageText, m.role === 'user' && styles.textUser]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))
        )}
        
        {chatLoading && (
          <View style={styles.message}>
            <View style={styles.messageAvatar}>
              <Ionicons name="sparkles" size={14} color={colors.purple} />
            </View>
            <View style={styles.messageBubble}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.coachInputArea}>
        <TextInput
          style={styles.coachInput}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.text3}
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.sendBtn, chatInput.trim() && styles.sendBtnActive]}
          onPress={sendMessage}
          disabled={!chatInput.trim() || chatLoading}
        >
          <Ionicons name="send" size={20} color={chatInput.trim() ? '#fff' : colors.text3} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
  
  // ═══════════════════════════════════════════════════════════════
  // PLAN TAB
  // ═══════════════════════════════════════════════════════════════
  const renderPlanTab = () => {
    const c = data.curriculum;
    
    if (!c) {
      return (
        <View style={styles.emptyPlan}>
          <Text style={styles.emptyText}>No curriculum yet.</Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.curriculumCard}>
          <View style={styles.curriculumHeader}>
            <View style={styles.curriculumIcon}>
              <Ionicons name="trophy" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.curriculumTitle}>{c.title}</Text>
              <Text style={styles.curriculumMeta}>Week {data.currentWeek} of {c.totalWeeks}</Text>
            </View>
          </View>
          
          {c.phases?.map((phase, i) => (
            <View key={i} style={styles.phase}>
              <View style={styles.phaseHeader}>
                <View style={styles.phaseDot} />
                <Text style={styles.phaseName}>{phase.name}</Text>
              </View>
              <View style={styles.phaseWeeks}>
                {phase.weeks?.map((week, j) => (
                  <View 
                    key={j} 
                    style={[
                      styles.weekItem,
                      week.week === data.currentWeek && styles.weekItemCurrent
                    ]}
                  >
                    <Text style={[
                      styles.weekNum,
                      week.week === data.currentWeek && styles.weekNumCurrent
                    ]}>
                      Week {week.week} {week.week === data.currentWeek ? '← Current' : ''}
                    </Text>
                    <Text style={styles.weekMilestone}>{week.milestone}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.viewWeekBtn} 
          onPress={() => setShowWeekPlan(true)}
        >
          <Text style={styles.viewWeekBtnText}>View This Week</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════
  // PROFILE TAB
  // ═══════════════════════════════════════════════════════════════
  const renderProfileTab = () => {
    const badges = MILESTONES.filter(m => (data.streakDays || streak) >= m.day);
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(data.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{data.name || 'Climber'}</Text>
          <Text style={styles.profileWeek}>Week {data.currentWeek}</Text>
        </View>
        
        <View style={styles.planCard}>
          <View style={styles.planCardHeader}>
            <View style={[styles.planCardIcon, { backgroundColor: colors.successLight }]}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
            </View>
            <View>
              <Text style={styles.planCardTitle}>{data.streakDays || streak} Day Streak</Text>
              <Text style={styles.planCardMeta}>{60 - (data.streakDays || streak)} to autopilot</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges Earned</Text>
        </View>
        <View style={styles.badgesGrid}>
          {badges.length === 0 ? (
            <Text style={styles.emptyText}>Complete your first week to earn badges!</Text>
          ) : (
            badges.map((b, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeIcon}>{b.icon}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            ))
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.resetBtn}
          onPress={() => {
            Alert.alert(
              'Reset All Data',
              'This will delete all your progress. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: async () => {
                    const freshData = {
                      ...data,
                      habits: [],
                      completions: [],
                      taskCompletions: [],
                      streakDays: 0,
                      unlockedMilestones: [],
                      chatMessages: [],
                    };
                    setData(freshData);
                    await saveData(freshData);
                    setChatMessages([]);
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════
  // WEEKLY PLAN SCREEN
  // ═══════════════════════════════════════════════════════════════
  const renderWeeklyPlan = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = today.getDay();
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.weekPlanHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowWeekPlan(false)}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.weekPlanTitle}>Week {data.currentWeek} Plan</Text>
          <Text style={styles.weekPlanSubtitle}>{currentMilestone}</Text>
        </View>
        
        <ScrollView style={styles.weekPlanContent}>
          <View style={styles.planCard}>
            <View style={styles.planCardHeader}>
              <View style={styles.planCardIcon}>
                <Ionicons name="calendar" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.planCardTitle}>Daily Tasks</Text>
                <Text style={styles.planCardMeta}>{data.dailyTasks?.length || 0} tasks</Text>
              </View>
            </View>
            
            {data.dailyTasks?.map((task, i) => {
              const isToday = i === todayDay;
              const isDone = data.taskCompletions?.includes(`week${data.currentWeek}-day${task.day}`);
              
              return (
                <View key={i} style={styles.dayTask}>
                  <View style={[
                    styles.dayNum,
                    isToday && styles.dayNumToday,
                    isDone && styles.dayNumDone
                  ]}>
                    <Text style={[
                      styles.dayNumText,
                      (isToday || isDone) && styles.dayNumTextLight
                    ]}>{task.day}</Text>
                  </View>
                  <View style={styles.dayContent}>
                    <Text style={styles.dayLabel}>{dayNames[i] || `Day ${task.day}`}</Text>
                    <Text style={styles.dayText}>{task.task}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        
        <View style={styles.weekPlanFooter}>
          <TouchableOpacity 
            style={styles.goTodayBtn}
            onPress={() => {
              setShowWeekPlan(false);
              setActiveTab('today');
            }}
          >
            <Text style={styles.goTodayBtnText}>Go to Today</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };
  
  // If showing weekly plan, render that instead
  if (showWeekPlan) {
    return renderWeeklyPlan();
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.bg3 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text3 }]}>Hello, {data.name || 'Climber'}</Text>
          <Text style={[styles.date, { color: colors.text }]}>{formatDate()}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>
            {(data.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Tab Content */}
      {activeTab === 'today' && renderTodayTab()}
      {activeTab === 'trends' && renderTrendsTab()}
      {activeTab === 'coach' && renderCoachTab()}
      {activeTab === 'plan' && renderPlanTab()}
      {activeTab === 'profile' && renderProfileTab()}
      
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.bg3 }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: colors.accentLight }]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab);
            }}
          >
            <Ionicons 
              name={TAB_ICONS[tab]} 
              size={22} 
              color={activeTab === tab ? colors.accent : colors.text3} 
            />
            <Text style={[
              styles.tabLabel, 
              { color: colors.text3 },
              activeTab === tab && { color: colors.accent }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Add Habit Modal */}
      <AddHabitModal
        visible={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        onAdd={handleAddHabit}
      />
      
      {/* 60 Days Info Modal */}
      <Modal visible={show60DaysInfo} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={{ fontSize: 32 }}>🧠</Text>
              <Text style={styles.infoModalTitle}>Why 60 Days?</Text>
            </View>
            <View style={styles.infoModalBody}>
              <Text style={styles.infoModalText}>
                Research by Dr. Phillippa Lally at UCL found that it takes an <Text style={{ fontWeight: '700' }}>average of 66 days</Text> for a new behavior to become automatic.
              </Text>
              <Text style={styles.infoModalText}>
                Missing a single day doesn't reset your progress. Consistency matters more than perfection.
              </Text>
              <Text style={styles.infoModalSource}>
                Source: Lally et al. (2010), European Journal of Social Psychology
              </Text>
            </View>
            <TouchableOpacity style={styles.infoModalBtn} onPress={() => setShow60DaysInfo(false)}>
              <Text style={styles.infoModalBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Milestone Modal */}
      <Modal visible={!!showMilestone} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.milestoneContent, { backgroundColor: colors.card }]}>
            <Text style={styles.milestoneBadge}>{showMilestone?.icon}</Text>
            <Text style={[styles.milestoneTitle, { color: colors.text }]}>{showMilestone?.name} Reached!</Text>
            <Text style={[styles.milestoneSubtitle, { color: colors.text2 }]}>{showMilestone?.message}</Text>
            <TouchableOpacity 
              style={[styles.milestoneBtn, { backgroundColor: colors.accent }]} 
              onPress={() => {
                haptics.tap();
                setShowMilestone(null);
              }}
            >
              <Text style={styles.milestoneBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Pool Info Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal visible={showPoolInfo} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.infoModalContent, { backgroundColor: colors.card, maxWidth: 340 }]}>
            <PoolInfoContent colors={colors} />
            <TouchableOpacity 
              style={[styles.infoModalBtn, { backgroundColor: colors.accent }]} 
              onPress={() => {
                haptics.tap();
                setShowPoolInfo(false);
              }}
            >
              <Text style={styles.infoModalBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Miss Recovery Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MissRecoveryModal
        visible={showMissRecovery}
        recoveryInfo={missRecoveryInfo}
        onDismiss={() => {
          setShowMissRecovery(false);
          // Mark as seen for today
          setData(prev => ({ ...prev, hasSeenMissRecovery: true }));
          saveData({ ...data, hasSeenMissRecovery: true });
        }}
        onTalkToCoach={() => {
          setShowMissRecovery(false);
          setActiveTab('coach');
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Variable Reward Toast */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <RewardToast
        visible={showRewardToast}
        context={rewardContext}
        onHide={() => setShowRewardToast(false)}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Log Activity Modal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <LogActivityModal
        visible={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        onLogRecharge={handleLogRecharge}
        onLogDrain={handleLogDrain}
        currentPoolLevel={poolLevel}
      />
    </SafeAreaView>
  );
}

// Static colors for StyleSheet (use useTheme for dynamic colors in render)
const colors = staticColors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg3,
  },
  greeting: {
    fontSize: 13,
    color: colors.text3,
    fontWeight: '500',
  },
  date: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  
  // Goal card at top of Today
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.bg2,
  },
  dayBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayBadgeText: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoBtn: {
    marginLeft: 6,
    padding: 4,
  },
  
  // Stats grid for Trends
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
  },
  
  // ═══════════════════════════════════════════════════════════════
  // Resilient Streak / Consistency Card Styles
  // ═══════════════════════════════════════════════════════════════
  consistencyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  consistencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  consistencyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  consistencyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consistencyStat: {
    flex: 1,
    alignItems: 'center',
  },
  consistencyNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  consistencyLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  consistencyDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  consistencyMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Habit breakdown stats
  habitStatCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    ...shadows.sm,
  },
  habitStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  habitStatName: {
    fontSize: 15,
    fontWeight: '600',
  },
  miniStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  miniStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  habitStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitStatLabel: {
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  emptyHabits: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text3,
    marginBottom: 12,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
  },
  addFirstText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  
  // Coach styles
  coachContainer: {
    flex: 1,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg3,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    backgroundColor: colors.purpleLight,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  coachStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: colors.text3,
  },
  coachMessages: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    gap: 16,
  },
  welcomeBox: {
    alignItems: 'center',
    padding: 24,
  },
  welcomeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  coachContext: {
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  coachContextTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coachContextText: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    padding: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.bg3,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.text2,
  },
  message: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '85%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    backgroundColor: colors.purpleLight,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    ...shadows.sm,
  },
  bubbleUser: {
    backgroundColor: colors.accent,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  textUser: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.text3,
    borderRadius: 4,
  },
  coachInputArea: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
  },
  coachInput: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.bg2,
    borderRadius: 24,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bg3,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.accent,
  },
  
  // Plan styles
  emptyPlan: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  curriculumCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadows.sm,
  },
  curriculumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  curriculumIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  curriculumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  curriculumMeta: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 2,
  },
  phase: {
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  phaseWeeks: {
    paddingLeft: 16,
  },
  weekItem: {
    paddingVertical: 8,
  },
  weekItemCurrent: {
    backgroundColor: colors.accentLight,
    margin: -8,
    marginLeft: -12,
    padding: 8,
    paddingLeft: 12,
    borderRadius: 8,
  },
  weekNum: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
  },
  weekNumCurrent: {
    color: colors.accent,
  },
  weekMilestone: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  viewWeekBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  viewWeekBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Profile styles
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  profileWeek: {
    fontSize: 14,
    color: colors.text3,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadows.sm,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planCardIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  planCardMeta: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginTop: 4,
  },
  resetBtn: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  
  // Week plan styles
  weekPlanHeader: {
    padding: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtnText: {
    color: colors.accent,
    fontSize: 15,
    marginLeft: 4,
  },
  weekPlanTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  weekPlanSubtitle: {
    fontSize: 15,
    color: colors.text2,
    lineHeight: 22,
  },
  weekPlanContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg2,
  },
  dayNum: {
    width: 32,
    height: 32,
    backgroundColor: colors.bg2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumToday: {
    backgroundColor: colors.accent,
  },
  dayNumDone: {
    backgroundColor: colors.success,
  },
  dayNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text3,
  },
  dayNumTextLight: {
    color: '#fff',
  },
  dayContent: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  weekPlanFooter: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
  },
  goTodayBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  goTodayBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    maxWidth: 320,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  infoModalBody: {
    marginBottom: 16,
  },
  infoModalText: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoModalSource: {
    fontSize: 12,
    color: colors.text3,
    fontStyle: 'italic',
    marginTop: 8,
  },
  infoModalBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  infoModalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  milestoneContent: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  milestoneBadge: {
    fontSize: 60,
    marginBottom: 16,
  },
  milestoneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  milestoneSubtitle: {
    fontSize: 15,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  milestoneBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.md,
  },
  milestoneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
