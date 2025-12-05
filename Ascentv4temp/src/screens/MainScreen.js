import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Modal, Alert,
  Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { shadows, QUOTES, MILESTONES, lightColors as staticColors, spacing } from '../constants/theme';
import {
  isHabitCompletedToday, calculateHabitStreak,
  calculateOverallStreak, getTodayStr,
  savePoolHistorySnapshot,
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
  getRecommendedHabitOrder,
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
import { PoolOnboarding, QuickPoolTip } from '../components/PoolOnboarding';
import { RatchetUpModal, RatchetDownBanner } from '../components/RatchetModal';
import { PoolHistoryChart, CrossTitrationChart, PoolInsightsSummary } from '../components/PoolHistory';
import SettingsScreen from './SettingsScreen';
import { BottomActionZone, CompactActionZone } from '../components/BottomActionZone';
import { ListSkeleton, HabitCardSkeleton } from '../components/SkeletonLoaders';

// Ratchet service
import { checkRatchetUp, checkRatchetDown, applyRatchet, calculateHabitConsistency } from '../services/ratchet';

// New spec components - Bioluminescent Depth theme
import { OrganicPoolVessel, CompactPoolVessel } from '../components/pool/OrganicPoolVessel';
import { IntentionBanner } from '../components/intention/IntentionBanner';
import { NextUpCard } from '../components/cards/NextUpCard';

// Contextual hints for intuitive navigation
import { HintBubble, PulseIndicator, InlineHint, FeatureSpotlight, SwipeHint } from '../components/HintBubble';

// Rave Mode celebration
import { RaveOverlay } from '../components/RaveOverlay';
import { useRaveAudio } from '../services/raveAudio';

// Retention system - Loss aversion, identity reinforcement, milestone celebrations
import {
  MilestoneModal,
  LossAversionBanner,
  IdentityToast,
  ProgressHeader,
} from '../components/RetentionComponents';
import {
  getLossAversionCopy,
  getIdentityMessage,
  checkForMilestone,
  getProgressSummary,
  RETENTION_MILESTONES,
} from '../services/retention';

// Updated tabs - Trends between Today and Coach
const TABS = ['today', 'trends', 'coach', 'plan', 'profile'];
const TAB_ICONS = {
  today: 'sunny',
  trends: 'stats-chart',
  coach: 'chatbubble-ellipses',
  plan: 'map',
  profile: 'person',
};

// ═══════════════════════════════════════════════════════════════
// ARRIVAL MOMENT GREETINGS
// ═══════════════════════════════════════════════════════════════
const ARRIVAL_GREETINGS = {
  morning: [
    { message: "Fresh start today.", subtext: "Your pool has refilled overnight." },
    { message: "Good morning.", subtext: "Let's build on yesterday." },
    { message: "New day, new energy.", subtext: "What matters most today?" },
  ],
  afternoon: [
    { message: "Afternoon check-in.", subtext: "Still time to make progress." },
    { message: "Hey there.", subtext: "Small wins still count." },
    { message: "Back at it.", subtext: "Consistency beats intensity." },
  ],
  evening: [
    { message: "Evening mode.", subtext: "Wrap up what you can." },
    { message: "Day's winding down.", subtext: "Any quick wins left?" },
    { message: "Almost done.", subtext: "Even 2 minutes counts." },
  ],
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getRandomGreeting = () => {
  const timeOfDay = getTimeOfDay();
  const greetings = ARRIVAL_GREETINGS[timeOfDay];
  return greetings[Math.floor(Math.random() * greetings.length)];
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
  // ARRIVAL MOMENT STATE (3-sec greeting before content)
  // ═══════════════════════════════════════════════════════════════
  const [showArrival, setShowArrival] = useState(true);
  const [arrivalGreeting] = useState(getRandomGreeting);
  const arrivalOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);

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

  // Settings & Onboarding
  const [showSettings, setShowSettings] = useState(false);
  const [showPoolOnboarding, setShowPoolOnboarding] = useState(false);

  // Ratchet (invisible escalation)
  const [ratchetSuggestion, setRatchetSuggestion] = useState(null);
  const [showRatchetModal, setShowRatchetModal] = useState(false);

  // Contextual hints state (for intuitive navigation)
  const [showPoolHint, setShowPoolHint] = useState(false);
  const [showHabitHint, setShowHabitHint] = useState(false);
  const [showIntentionHint, setShowIntentionHint] = useState(false);
  const [poolTapFeedback, setPoolTapFeedback] = useState(null);

  // Rave Mode state
  const [raveTriggered, setRaveTriggered] = useState(false);
  const { soundRef: raveAudioRef } = useRaveAudio();

  // Retention system state
  const [showRetentionMilestone, setShowRetentionMilestone] = useState(null);
  const [identityToast, setIdentityToast] = useState({ visible: false, message: '', type: 'reinforcement' });

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
  // ARRIVAL MOMENT ANIMATION (3-sec greeting before showing content)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Check if we should show arrival (only once per session)
    const shouldShowArrivalMoment = !data.hasSeenArrivalToday ||
      new Date(data.lastArrivalTime || Date.now()).toDateString() !== new Date().toDateString();

    if (shouldShowArrivalMoment) {
      // Fade in greeting
      Animated.timing(arrivalOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // After 2.5 seconds, fade out greeting and fade in content
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(arrivalOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            delay: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowArrival(false);
          setIsLoading(false);
          // Mark arrival as seen for today
          setData(prev => ({
            ...prev,
            hasSeenArrivalToday: true,
            lastArrivalTime: new Date().toISOString(),
          }));
        });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Skip arrival, show content immediately
      setShowArrival(false);
      setIsLoading(false);
      contentOpacity.setValue(1);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // NEW: Initialize Pool and Check for Insights/Recovery on mount
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Initialize or update pool for new day
    const today = new Date().toISOString().split('T')[0];
    const lastPoolUpdate = data.poolData?.lastUpdated?.split('T')[0];
    
    if (lastPoolUpdate !== today) {
      // New day - save yesterday's snapshot to history first
      if (data.poolData?.lastUpdated) {
        const yesterdaySnapshot = {
          date: lastPoolUpdate,
          morningLevel: data.poolData.morningLevel || 65,
          endLevel: data.poolData.currentLevel || 65,
          drains: data.poolData.drainActivities?.length || 0,
          recharges: data.poolData.rechargeActivities?.length || 0,
          habitsCompleted: todayHabitsDone,
          totalHabits: data.habits.length,
        };
        const updatedHistory = [...(data.poolHistory || []), yesterdaySnapshot].slice(-90); // Keep 90 days

        // Calculate morning pool for today
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
        setData(prev => ({ ...prev, poolData: newPoolData, poolHistory: updatedHistory }));
        saveData({ ...data, poolData: newPoolData, poolHistory: updatedHistory });
      } else {
        // First time - just set up pool
        const morningLevel = calculateMorningPool({
          yesterdayComplete: false,
          streakDays: data.streakDays || 0,
          lastSleepHours: data.lastSleepHours,
        });

        const newPoolData = {
          currentLevel: morningLevel,
          morningLevel: morningLevel,
          lastUpdated: new Date().toISOString(),
          drainActivities: [],
          rechargeActivities: [],
        };

        setPoolLevel(morningLevel);
        setData(prev => ({ ...prev, poolData: newPoolData }));
        saveData({ ...data, poolData: newPoolData });
      }
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
    
    // Check for pool onboarding (first time seeing pool)
    if (!data.hasSeenPoolIntro && data.settings?.showDopaminePool !== false) {
      setTimeout(() => setShowPoolOnboarding(true), 500);
    }

    // Show contextual hints for new users (after onboarding is dismissed)
    if (data.hasSeenPoolIntro && !data.hasSeenPoolHint) {
      setTimeout(() => setShowPoolHint(true), 1000);
    }
    if (data.habits?.length > 0 && !data.hasSeenHabitHint) {
      setTimeout(() => setShowHabitHint(true), 2500);
    }
    if (!data.dailyIntention?.text && !data.hasSeenIntentionHint) {
      setTimeout(() => setShowIntentionHint(true), 4000);
    }
    
    // Check for ratchet opportunities (weekly)
    if (data.settings?.invisibleRatchet) {
      const lastRatchetCheck = data.lastRatchetCheck;
      const daysSinceCheck = lastRatchetCheck 
        ? Math.floor((Date.now() - new Date(lastRatchetCheck).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (daysSinceCheck >= 7) {
        // Check each habit for ratchet opportunity
        for (const habit of data.habits) {
          const suggestion = checkRatchetUp(habit, data.completions, data.ratchetHistory || {});
          if (suggestion) {
            setRatchetSuggestion(suggestion);
            setShowRatchetModal(true);
            break; // Show one at a time
          }
        }
        // Mark check time
        setData(prev => ({ ...prev, lastRatchetCheck: new Date().toISOString() }));
        saveData({ ...data, lastRatchetCheck: new Date().toISOString() });
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // RETENTION MILESTONE CHECK (Day 1, 3, 7, 14, 30, 60, 100)
    // ═══════════════════════════════════════════════════════════════
    if (data.startDate) {
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1; // +1 because day 1 is the start day

      const milestone = checkForMilestone(daysSinceStart, data.shownRetentionMilestones || []);
      if (milestone) {
        // Delay milestone modal slightly for smoother UX
        setTimeout(() => {
          setShowRetentionMilestone(milestone);
        }, 1500);
      }
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Calculate resilient streaks
  // ═══════════════════════════════════════════════════════════════
  const overallStreakData = useMemo(() => {
    return calculateOverallResilientStreak(data.habits, data.completions);
  }, [data.habits, data.completions]);

  // ═══════════════════════════════════════════════════════════════
  // NEW: Habit resistance scoring and sorting
  // Sort habits by pool-aware recommendation (hard first when high, easy first when low)
  // ═══════════════════════════════════════════════════════════════
  const sortedHabits = useMemo(() => {
    if (!data.habits || data.habits.length === 0) return [];

    // Calculate resistance score for each habit
    const habitsWithResistance = data.habits.map(habit => {
      const habitStreak = calculateResilientStreak(data.completions, habit.id);
      const isCompleted = isHabitCompletedToday(data.completions, habit.id);

      // Resistance score: higher = harder to complete
      // Based on: streak volatility, completion frequency, time of day patterns
      let resistance = habit.resistance || 5; // Default mid-range

      // Adjust based on streak status
      if (habitStreak.status === 'rebuilding') resistance += 2;
      if (habitStreak.status === 'solid') resistance -= 1;

      // Already completed today = lowest priority
      if (isCompleted) resistance = -10;

      return { ...habit, calculatedResistance: resistance };
    });

    // Sort based on pool level
    return getRecommendedHabitOrder(habitsWithResistance, poolLevel);
  }, [data.habits, data.completions, poolLevel]);

  // Get the next incomplete habit for BottomActionZone
  const nextIncompleteHabit = useMemo(() => {
    return sortedHabits.find(h => !isHabitCompletedToday(data.completions, h.id));
  }, [sortedHabits, data.completions]);
  
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

      // Identity reinforcement toast (feeling-focused feedback)
      const identityMsg = getIdentityMessage({
        streak: newStreak,
        completedToday: todayHabitsDone + 1,
        totalCompletions: (data.completions?.length || 0) + 1,
        consistency: overallStreakData.consistencyScore || 50,
      });

      // Show identity toast occasionally (not every time - variable reward)
      if (Math.random() < 0.4 || newStreak >= 7) { // 40% chance or always for 7+ streak
        setTimeout(() => {
          setIdentityToast({ visible: true, message: identityMsg.message, type: identityMsg.type });
        }, 1500);
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
  // LOSS AVERSION COPY (calculated based on time, streak, incomplete habits)
  // ═══════════════════════════════════════════════════════════════
  const lossAversionCopy = useMemo(() => {
    const currentHour = new Date().getHours();
    return getLossAversionCopy(streak, incompleteHabits.length, currentHour);
  }, [streak, incompleteHabits.length]);

  // Should show loss aversion banner (evening + incomplete + streak to protect)
  const showLossAversionBanner = useMemo(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 17 && incompleteHabits.length > 0 && (streak > 0 || incompleteHabits.length >= 2);
  }, [incompleteHabits.length, streak]);

  // Progress summary for glanceability
  const progressSummary = useMemo(() => {
    return getProgressSummary({
      habits: data.habits,
      completions: data.completions,
      streak,
      completedToday: todayHabitsDone,
      poolLevel,
    });
  }, [data.habits, data.completions, streak, todayHabitsDone, poolLevel]);

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

      {/* Loss Aversion Banner - "Don't lose your streak" framing */}
      {showLossAversionBanner && !streakAtRisk && (
        <LossAversionBanner
          title={lossAversionCopy.title}
          message={lossAversionCopy.message}
          urgency={lossAversionCopy.urgency}
          actionLabel={incompleteHabits.length === 1 ? "Do it now" : "Start"}
          onAction={() => {
            haptics.tap();
            // Scroll to first incomplete habit or trigger quick action
            if (nextIncompleteHabit) {
              // Could implement scroll-to or highlight
            }
          }}
        />
      )}

      {/* Progress Header - Glanceable: What I've done, How far I've come, What's next */}
      {data.habits.length > 0 && (
        <ProgressHeader
          accomplished={progressSummary.accomplished}
          journey={progressSummary.journey}
          nextAction={progressSummary.nextAction}
          progressPercent={progressSummary.progressPercent}
          energyLabel={progressSummary.energyLabel}
          poolLevel={poolLevel}
          isComplete={progressSummary.isComplete}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ORGANIC POOL VESSEL - THE HERO VISUAL (Bioluminescent Depth)
          Per spec: Curved asymmetric flask, not a cylinder
          ═══════════════════════════════════════════════════════════════ */}
      {data.showDopaminePool !== false && (
        <View style={styles.poolContainer}>
          {/* Pool Hint Bubble */}
          <HintBubble
            visible={showPoolHint}
            message="Tap to learn more"
            subtext="Your Drive Pool shows available motivation"
            icon="water"
            position="bottom"
            onDismiss={() => {
              setShowPoolHint(false);
              setData(prev => ({ ...prev, hasSeenPoolHint: true }));
              saveData({ ...data, hasSeenPoolHint: true });
            }}
            autoDismiss={6000}
            style={{ top: -60, alignSelf: 'center' }}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              haptics.tap();
              // Show tap feedback with pool status message
              const statusMsg = poolLevel >= 70
                ? "High energy! Great time for challenging tasks"
                : poolLevel >= 40
                  ? "Moderate energy. Pace yourself today"
                  : "Low energy. Try 2-minute versions";
              setPoolTapFeedback(statusMsg);
              setTimeout(() => setPoolTapFeedback(null), 2500);
              setShowPoolInfo(true);
            }}
          >
            <OrganicPoolVessel
              level={poolLevel}
              size="large"
              showLabel={true}
              animated={true}
            />
          </TouchableOpacity>

          {/* Pool tap feedback message */}
          {poolTapFeedback && (
            <Animated.View style={[styles.poolFeedback, { backgroundColor: colors.card }]}>
              <Ionicons
                name={poolLevel >= 70 ? "flash" : poolLevel >= 40 ? "sunny" : "moon"}
                size={14}
                color={poolLevel >= 70 ? colors.success : poolLevel >= 40 ? colors.warning : colors.accent}
              />
              <Text style={[styles.poolFeedbackText, { color: colors.text2 }]}>
                {poolTapFeedback}
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.poolLogButton, { backgroundColor: colors.bg3, borderColor: colors.border }]}
            onPress={() => setShowLogActivity(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.text2} />
            <Text style={[styles.poolLogText, { color: colors.text2 }]}>Log Activity</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Low Pool Guidance */}
      <LowPoolGuidance poolLevel={poolLevel} colors={colors} />

      {/* ═══════════════════════════════════════════════════════════════
          DAILY INTENTION - "Today I will..."
          Per spec: Micro-commitment that focuses attention
          ═══════════════════════════════════════════════════════════════ */}
      <IntentionBanner
        intention={data.dailyIntention?.date === getTodayStr() ? data.dailyIntention.text : null}
        isComplete={data.dailyIntention?.date === getTodayStr() && data.dailyIntention?.completed}
        onSetIntention={(text) => {
          const newIntention = { text, date: getTodayStr(), completed: false };
          const updated = {
            ...data,
            dailyIntention: newIntention,
            intentionHistory: [...(data.intentionHistory || []), newIntention].slice(-30)
          };
          setData(updated);
          saveData(updated);
        }}
        onToggleComplete={(completed) => {
          const newIntention = { ...data.dailyIntention, completed };
          const updated = { ...data, dailyIntention: newIntention };
          setData(updated);
          saveData(updated);
          // Trigger rave mode on intention completion
          if (completed && data.settings?.raveMode) {
            setRaveTriggered(true);
          }
        }}
        style={{ marginHorizontal: spacing.screenPadding, marginBottom: spacing.md }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          NEXT UP CARD - Smart habit suggestion
          Per spec: Reduces cognitive load, answers "What now?"
          ═══════════════════════════════════════════════════════════════ */}
      {nextIncompleteHabit && (
        <NextUpCard
          habit={nextIncompleteHabit}
          poolLevel={poolLevel}
          consistency={nextIncompleteHabit ? calculateHabitConsistency(data.completions, nextIncompleteHabit.id) : 0}
          floor={data.ratchetData?.habitFloors?.[nextIncompleteHabit?.id]?.floor || 0}
          onComplete={toggleHabit}
          onSkip={(habitId) => {
            // Move to next habit (handled by re-render after completion)
            haptics.select();
          }}
          onTwoMinute={(habit) => {
            // Show 2-minute version modal
            setActiveTab('coach');
            setChatInput(`I need the 2-minute version for "${habit.name}"`);
          }}
          style={{ marginHorizontal: spacing.screenPadding, marginBottom: spacing.md }}
        />
      )}

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
      
      {sortedHabits.length === 0 ? (
        <View style={[styles.emptyHabits, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="repeat-outline" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Build Your First Habit</Text>
          <Text style={[styles.emptyText, { color: colors.text3 }]}>
            Start with something small you can do in 2 minutes.{'\n'}Consistency beats intensity.
          </Text>
          <TouchableOpacity
            style={[styles.addFirstBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              haptics.tap();
              setShowAddHabit(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstBtnText}>Add Your First Habit</Text>
          </TouchableOpacity>
          <Text style={[styles.emptyHint, { color: colors.text3 }]}>
            Tip: "Read 1 page" is better than "Read 30 minutes"
          </Text>
        </View>
      ) : (
        <>
          {/* Pool-aware ordering hint */}
          {poolLevel < 40 && sortedHabits.length > 1 && (
            <View style={[styles.orderingHint, { backgroundColor: colors.warningLight || '#fef3c7' }]}>
              <Ionicons name="arrow-down" size={14} color={colors.warning || '#d97706'} />
              <Text style={[styles.orderingHintText, { color: colors.warning || '#d97706' }]}>
                Sorted by ease — start simple today
              </Text>
            </View>
          )}
          {poolLevel >= 70 && sortedHabits.length > 1 && (
            <View style={[styles.orderingHint, { backgroundColor: colors.successLight || '#dcfce7' }]}>
              <Ionicons name="flash" size={14} color={colors.success || '#22c55e'} />
              <Text style={[styles.orderingHintText, { color: colors.success || '#22c55e' }]}>
                High energy — tackle hard habits first
              </Text>
            </View>
          )}
          {sortedHabits.map((habit, index) => {
            const habitStreakData = calculateResilientStreak(data.completions, habit.id);
            const isFirstHabit = index === 0;
            return (
              <View key={habit.id}>
                {/* Show hint on first habit for new users */}
                {isFirstHabit && showHabitHint && (
                  <View style={styles.habitHintWrapper}>
                    <HintBubble
                      visible={showHabitHint}
                      message="Tap the circle to complete"
                      subtext="The sparkle button shows a 2-minute version"
                      icon="checkmark-circle"
                      position="top"
                      onDismiss={() => {
                        setShowHabitHint(false);
                        setData(prev => ({ ...prev, hasSeenHabitHint: true }));
                        saveData({ ...data, hasSeenHabitHint: true });
                      }}
                      autoDismiss={7000}
                      style={{ bottom: -8, alignSelf: 'center', zIndex: 100 }}
                    />
                  </View>
                )}
                <HabitCard
                  habit={habit}
                  completed={isHabitCompletedToday(data.completions, habit.id)}
                  streak={habitStreakData.currentRun}
                  streakStatus={habitStreakData.status}
                  streakColor={habitStreakData.color}
                  onComplete={() => toggleHabit(habit.id)}
                  onDelete={() => deleteHabit(habit.id)}
                  poolLevel={poolLevel}
                  recommendation={habit.recommendation}
                  onTwoMinComplete={() => {
                    // Trigger rave mode on 2-min habit completion
                    if (data.settings?.raveMode) {
                      setRaveTriggered(true);
                    }
                  }}
                />
              </View>
            );
          })}
        </>
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
      
      {/* Pool History Charts (if enabled) */}
      {data.settings?.showDopaminePool !== false && data.poolHistory?.length >= 3 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Drive Pool Trends</Text>
          </View>
          <PoolHistoryChart 
            poolHistory={data.poolHistory || []}
            days={14}
            showHabitCompletion={true}
          />
          
          {/* Pool Insights */}
          <PoolInsightsSummary
            poolHistory={data.poolHistory || []}
            habits={data.habits}
            completions={data.completions}
          />
        </>
      )}
      
      {/* Cross-Titration Chart (if screen time data exists) */}
      {data.screenTimeHistory?.length >= 14 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cross-Titration</Text>
          </View>
          <CrossTitrationChart
            screenTimeHistory={data.screenTimeHistory || []}
            habitCompletions={data.completions}
            weeks={8}
          />
        </>
      )}
      
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
              <View style={[styles.coachAvatarLarge, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="sparkles" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hey! I'm your AI coach</Text>
              <Text style={[styles.welcomeText, { color: colors.text2 }]}>
                I know your habits, your streaks, and your current energy level. Ask me anything about building consistency.
              </Text>
            </View>

            {/* What I can help with - intuitive feature discovery */}
            <View style={[styles.coachCapabilities, { backgroundColor: colors.card }]}>
              <Text style={[styles.capabilitiesTitle, { color: colors.text }]}>What I can help with:</Text>
              <View style={styles.capabilityRow}>
                <View style={[styles.capabilityIcon, { backgroundColor: colors.successLight || '#dcfce7' }]}>
                  <Ionicons name="flash-outline" size={16} color={colors.success || '#22c55e'} />
                </View>
                <Text style={[styles.capabilityText, { color: colors.text2 }]}>2-minute versions of your habits</Text>
              </View>
              <View style={styles.capabilityRow}>
                <View style={[styles.capabilityIcon, { backgroundColor: colors.warningLight || '#fef3c7' }]}>
                  <Ionicons name="battery-charging-outline" size={16} color={colors.warning || '#d97706'} />
                </View>
                <Text style={[styles.capabilityText, { color: colors.text2 }]}>Energy management strategies</Text>
              </View>
              <View style={styles.capabilityRow}>
                <View style={[styles.capabilityIcon, { backgroundColor: colors.accentLight || 'rgba(96, 165, 250, 0.15)' }]}>
                  <Ionicons name="trending-up-outline" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.capabilityText, { color: colors.text2 }]}>Streak recovery advice</Text>
              </View>
            </View>

            {/* Pool-aware context */}
            <View style={[styles.coachContext, { backgroundColor: colors.bg2 }]}>
              <View style={styles.contextHeader}>
                <Ionicons name="analytics-outline" size={14} color={colors.text3} />
                <Text style={[styles.coachContextTitle, { color: colors.text3 }]}>
                  Your current state:
                </Text>
              </View>
              <View style={styles.contextStats}>
                <View style={styles.contextStat}>
                  <Text style={[styles.contextStatValue, { color: poolLevel >= 70 ? colors.success : poolLevel >= 40 ? colors.warning : colors.accent }]}>
                    {poolLevel}%
                  </Text>
                  <Text style={[styles.contextStatLabel, { color: colors.text3 }]}>Energy</Text>
                </View>
                <View style={[styles.contextDivider, { backgroundColor: colors.border }]} />
                <View style={styles.contextStat}>
                  <Text style={[styles.contextStatValue, { color: colors.text }]}>
                    {overallStreakData.consistencyScore}%
                  </Text>
                  <Text style={[styles.contextStatLabel, { color: colors.text3 }]}>30-day</Text>
                </View>
                <View style={[styles.contextDivider, { backgroundColor: colors.border }]} />
                <View style={styles.contextStat}>
                  <Text style={[styles.contextStatValue, { color: colors.text }]}>
                    {incompleteHabits.length}
                  </Text>
                  <Text style={[styles.contextStatLabel, { color: colors.text3 }]}>To do</Text>
                </View>
              </View>
            </View>

            {/* Quick action hint */}
            <InlineHint
              visible={true}
              message="Tap a suggestion or type your own question"
              icon="chatbubble-outline"
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />

            <View style={styles.suggestions}>
              {/* Dynamic suggestions based on context */}
              {[
                poolLevel < 40
                  ? { text: "My energy is low. What should I do?", icon: "battery-dead" }
                  : { text: "I'm struggling with motivation", icon: "help-circle" },
                incompleteHabits.length > 0
                  ? { text: `Help me complete ${incompleteHabits[0]?.name || 'my habits'}`, icon: "checkmark-circle" }
                  : { text: "Help me build a new habit", icon: "add-circle" },
                overallStreakData.status !== 'solid'
                  ? { text: "How do I get more consistent?", icon: "trending-up" }
                  : { text: "I keep breaking my streak", icon: "flame" },
                { text: "What's my 2-minute version?", icon: "timer" },
              ].map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionChip, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                  onPress={() => handleSuggestion(s.text)}
                >
                  <Ionicons name={s.icon} size={14} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{s.text}</Text>
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
          <Text style={[styles.profileName, { color: colors.text }]}>{data.name || 'Climber'}</Text>
          <Text style={[styles.profileWeek, { color: colors.text2 }]}>Week {data.currentWeek}</Text>
          
          {/* Settings Button */}
          <TouchableOpacity 
            style={[styles.settingsBtn, { backgroundColor: colors.bg2 }]}
            onPress={() => {
              haptics.tap();
              setShowSettings(true);
            }}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text2} />
            <Text style={[styles.settingsBtnText, { color: colors.text2 }]}>Settings</Text>
          </TouchableOpacity>
        </View>
        
        {/* Consistency Overview */}
        <View style={[styles.planCard, { backgroundColor: colors.card }]}>
          <View style={styles.planCardHeader}>
            <View style={[styles.planCardIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="pulse" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planCardTitle, { color: colors.text }]}>
                {overallStreakData.consistencyScore}% Consistency
              </Text>
              <Text style={[styles.planCardMeta, { color: colors.text3 }]}>
                {overallStreakData.status === 'solid' ? 'Solid habits forming' :
                 overallStreakData.status === 'amber' ? 'Building momentum' :
                 'Every rep counts'}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: overallStreakData.color }]} />
          </View>
        </View>
        
        {/* Pool History Chart */}
        {data.settings?.showDopaminePool !== false && data.poolHistory?.length > 0 && (
          <PoolHistoryChart 
            poolHistory={data.poolHistory}
            days={14}
          />
        )}
        
        {/* Pool Insights */}
        {data.settings?.showDopaminePool !== false && (
          <PoolInsightsSummary
            poolHistory={data.poolHistory || []}
            habits={data.habits}
            completions={data.completions}
          />
        )}
        
        {/* Cross-Titration (if screen time data exists) */}
        {data.screenTimeHistory?.length > 14 && (
          <CrossTitrationChart
            screenTimeHistory={data.screenTimeHistory}
            habitCompletions={data.completions}
            weeks={8}
          />
        )}
        
        {/* Legacy Streak Card */}
        <View style={[styles.planCard, { backgroundColor: colors.card }]}>
          <View style={styles.planCardHeader}>
            <View style={[styles.planCardIcon, { backgroundColor: colors.successLight }]}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
            </View>
            <View>
              <Text style={[styles.planCardTitle, { color: colors.text }]}>
                {data.streakDays || streak} Day Run
              </Text>
              <Text style={[styles.planCardMeta, { color: colors.text3 }]}>
                {60 - (data.streakDays || streak)} to autopilot
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges Earned</Text>
        </View>
        <View style={styles.badgesGrid}>
          {badges.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.text3 }]}>
              Complete your first week to earn badges!
            </Text>
          ) : (
            badges.map((b, i) => (
              <View key={i} style={[styles.badge, { backgroundColor: colors.card }]}>
                <Text style={styles.badgeIcon}>{b.icon}</Text>
                <Text style={[styles.badgeName, { color: colors.text }]}>{b.name}</Text>
              </View>
            ))
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {
            haptics.tap();
            setShowPoolOnboarding(true);
          }}
        >
          <Ionicons name="flask-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionCardText, { color: colors.text }]}>
            Learn About the Drive Pool
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text3} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => {
            haptics.tap();
            setShowLogActivity(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionCardText, { color: colors.text }]}>
            Log Recharge or Drain Activity
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text3} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.resetBtn, { backgroundColor: colors.bg2 }]}
          onPress={() => {
            haptics.warning();
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
                      poolData: { currentLevel: 65, morningLevel: 65 },
                      poolHistory: [],
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
          <Text style={[styles.resetBtnText, { color: colors.danger }]}>Reset All Data</Text>
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

  // ═══════════════════════════════════════════════════════════════
  // ARRIVAL MOMENT (3-sec greeting overlay)
  // ═══════════════════════════════════════════════════════════════
  if (showArrival) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <Animated.View style={[styles.arrivalOverlay, { opacity: arrivalOpacity }]}>
          <View style={styles.arrivalContent}>
            <Text style={[styles.arrivalGreeting, { color: colors.text }]}>
              {arrivalGreeting.message}
            </Text>
            <Text style={[styles.arrivalSubtext, { color: colors.text2 }]}>
              {arrivalGreeting.subtext}
            </Text>
            <View style={[styles.arrivalPoolPreview, { backgroundColor: colors.card }]}>
              <Text style={[styles.arrivalPoolLabel, { color: colors.text3 }]}>Drive Pool</Text>
              <Text style={[styles.arrivalPoolValue, { color: colors.accent }]}>{poolLevel}%</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, { opacity: contentOpacity }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.bg3 }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text3 }]}>Hello, {data.name || 'Climber'}</Text>
            <Text style={[styles.date, { color: colors.text }]}>{formatDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => {
                haptics.tap();
                setShowSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text2} />
            </TouchableOpacity>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>
                {(data.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'trends' && renderTrendsTab()}
        {activeTab === 'coach' && renderCoachTab()}
        {activeTab === 'plan' && renderPlanTab()}
        {activeTab === 'profile' && renderProfileTab()}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BOTTOM ACTION ZONE - Fixed button for current incomplete habit */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'today' && (
          <BottomActionZone
            currentHabit={nextIncompleteHabit}
            completedCount={todayHabitsDone}
            totalCount={data.habits.length}
            onComplete={(habitId) => toggleHabit(habitId)}
            dayComplete={dayProgress === 100}
          />
        )}
      </Animated.View>

      {/* Tab Bar - Enhanced with better visual feedback */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          // Add badge for incomplete habits on Today tab
          const showBadge = tab === 'today' && incompleteHabits.length > 0 && !isActive;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                isActive && { backgroundColor: colors.accentLight }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Ionicons
                  name={isActive ? TAB_ICONS[tab] : `${TAB_ICONS[tab]}-outline`}
                  size={22}
                  color={isActive ? colors.accent : colors.text3}
                />
                {/* Badge for incomplete habits */}
                {showBadge && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.tabBadgeText}>{incompleteHabits.length}</Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.tabLabel,
                { color: colors.text3 },
                isActive && styles.tabLabelActive,
                isActive && { color: colors.accent }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {/* Active indicator line */}
              {isActive && (
                <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
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
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Pool Onboarding (first time education) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PoolOnboarding
        visible={showPoolOnboarding}
        onComplete={() => {
          setShowPoolOnboarding(false);
          setData(prev => ({ ...prev, hasSeenPoolIntro: true }));
          saveData({ ...data, hasSeenPoolIntro: true });
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Ratchet Modal (invisible escalation) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <RatchetUpModal
        visible={showRatchetModal}
        ratchetData={ratchetSuggestion}
        onAccept={() => {
          if (ratchetSuggestion) {
            // Update habit target
            const updatedHabits = data.habits.map(h => 
              h.id === ratchetSuggestion.habitId 
                ? { ...h, amount: ratchetSuggestion.newTarget }
                : h
            );
            // Record ratchet
            const updatedHistory = applyRatchet(
              data.habits.find(h => h.id === ratchetSuggestion.habitId),
              ratchetSuggestion.newTarget,
              data.ratchetHistory || {}
            );
            setData(prev => ({ 
              ...prev, 
              habits: updatedHabits,
              ratchetHistory: updatedHistory,
            }));
            saveData({ 
              ...data, 
              habits: updatedHabits,
              ratchetHistory: updatedHistory,
            });
          }
          setShowRatchetModal(false);
          setRatchetSuggestion(null);
        }}
        onDecline={() => {
          setShowRatchetModal(false);
          setRatchetSuggestion(null);
        }}
        onDismiss={() => {
          setShowRatchetModal(false);
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Settings Screen */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showSettings && (
        <SettingsScreen
          data={data}
          onUpdateSettings={(newSettings) => {
            setData(prev => ({ ...prev, settings: newSettings }));
            saveData({ ...data, settings: newSettings });
          }}
          onExportData={() => {
            // Export data as JSON
            const exportData = JSON.stringify(data, null, 2);
            // In a real app, would share/save this file
            Alert.alert(
              'Data Exported',
              `${data.completions?.length || 0} completions, ${data.habits?.length || 0} habits ready to save.`,
              [{ text: 'OK' }]
            );
          }}
          onClearData={() => {
            // Reset all data
            const freshData = {
              habits: [],
              completions: [],
              tasks: [],
              settings: { showDopaminePool: true },
              poolData: { currentLevel: 65, morningLevel: 65 },
            };
            setData(freshData);
            saveData(freshData);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Pool Onboarding */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <PoolOnboarding
        visible={showPoolOnboarding}
        onComplete={() => {
          setShowPoolOnboarding(false);
          setData(prev => ({ ...prev, hasSeenPoolIntro: true }));
          saveData({ ...data, hasSeenPoolIntro: true });
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Ratchet Modal (Invisible Escalation) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <RatchetUpModal
        visible={showRatchetModal}
        ratchetData={ratchetSuggestion}
        onAccept={() => {
          if (ratchetSuggestion) {
            // Update habit target
            const updatedHabits = data.habits.map(h => 
              h.id === ratchetSuggestion.habitId 
                ? { ...h, amount: ratchetSuggestion.newTarget }
                : h
            );
            // Record ratchet
            const updatedHistory = applyRatchet(
              data.habits.find(h => h.id === ratchetSuggestion.habitId),
              ratchetSuggestion.newTarget,
              data.ratchetHistory || {}
            );
            
            setData(prev => ({ 
              ...prev, 
              habits: updatedHabits,
              ratchetHistory: updatedHistory,
            }));
            saveData({ 
              ...data, 
              habits: updatedHabits,
              ratchetHistory: updatedHistory,
            });
          }
          setShowRatchetModal(false);
          setRatchetSuggestion(null);
        }}
        onDecline={() => {
          setShowRatchetModal(false);
          setRatchetSuggestion(null);
        }}
        onDismiss={() => {
          setShowRatchetModal(false);
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* NEW: Settings Screen */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showSettings && (
        <SettingsScreen
          data={data}
          onUpdateSettings={(newSettings) => {
            setData(prev => ({ ...prev, settings: newSettings }));
            saveData({ ...data, settings: newSettings });
          }}
          onExportData={() => {
            // Export data as JSON
            const exportData = {
              habits: data.habits,
              completions: data.completions,
              poolHistory: data.poolHistory,
              ratchetHistory: data.ratchetHistory,
              exportDate: new Date().toISOString(),
              version: '2.0.0',
            };
            Alert.alert(
              'Data Exported',
              'Your data has been prepared. In a future update, this will save to your device.',
              [{ text: 'OK' }]
            );
            console.log('Export data:', JSON.stringify(exportData));
          }}
          onClearData={() => {
            setData({
              habits: [],
              completions: [],
              chatMessages: [],
              poolData: { currentLevel: 65, morningLevel: 65 },
              poolHistory: [],
              settings: {},
            });
            saveData({
              habits: [],
              completions: [],
              chatMessages: [],
              poolData: { currentLevel: 65, morningLevel: 65 },
              poolHistory: [],
              settings: {},
            });
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RETENTION: Milestone Modal (Day 1, 3, 7, 14, 30, 60, 100) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MilestoneModal
        visible={!!showRetentionMilestone}
        milestone={showRetentionMilestone}
        onDismiss={() => {
          // Mark milestone as shown
          const shownMilestones = [...(data.shownRetentionMilestones || []), showRetentionMilestone?.day];
          setData(prev => ({ ...prev, shownRetentionMilestones: shownMilestones }));
          saveData({ ...data, shownRetentionMilestones: shownMilestones });
          setShowRetentionMilestone(null);
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RETENTION: Identity Reinforcement Toast */}
      {/* "That's what you do now" - feeling-focused feedback */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <IdentityToast
        visible={identityToast.visible}
        message={identityToast.message}
        type={identityToast.type}
        onDismiss={() => setIdentityToast({ visible: false, message: '', type: 'reinforcement' })}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RAVE MODE - Audio-visual celebration */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <RaveOverlay
        trigger={raveTriggered}
        audioRef={raveAudioRef}
        onComplete={() => {
          setRaveTriggered(false);
        }}
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

  // ═══════════════════════════════════════════════════════════════
  // ARRIVAL MOMENT STYLES
  // ═══════════════════════════════════════════════════════════════
  arrivalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  arrivalContent: {
    alignItems: 'center',
  },
  arrivalGreeting: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  arrivalSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  arrivalPoolPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  arrivalPoolLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrivalPoolValue: {
    fontSize: 24,
    fontWeight: '800',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    padding: 8,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },

  // ═══════════════════════════════════════════════════════════════
  // ORGANIC POOL VESSEL STYLES (Bioluminescent Depth)
  // ═══════════════════════════════════════════════════════════════
  poolContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
  },
  poolLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  poolLogText: {
    fontSize: 14,
    fontWeight: '500',
  },
  poolFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  poolFeedbackText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Goal card at top of Today
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
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
  
  // Pool-aware ordering hint
  orderingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  orderingHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  habitHintWrapper: {
    position: 'relative',
    zIndex: 100,
    marginBottom: 4,
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
    borderRadius: 12,
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
    borderRadius: 16,
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
    borderRadius: 12,
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addFirstBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  emptyHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabActive: {
    transform: [{ scale: 1.02 }],
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
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
  coachAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coachCapabilities: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  capabilityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityText: {
    fontSize: 13,
    flex: 1,
  },
  coachContext: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  coachContextTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  contextStat: {
    alignItems: 'center',
    flex: 1,
  },
  contextStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  contextStatLabel: {
    fontSize: 11,
  },
  contextDivider: {
    width: 1,
    height: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 16,
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
    borderRadius: 12,
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
    borderRadius: 16,
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
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  
  // Settings & Profile enhancements
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  settingsBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    ...shadows.sm,
  },
  actionCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
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
    borderRadius: 12,
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
    borderRadius: 12,
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
    borderRadius: 12,
  },
  milestoneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
