// Variable Reward System
// Creates anticipation through randomized, meaningful rewards

// ═══════════════════════════════════════════════════════════════
// REWARD POOLS BY TYPE
// ═══════════════════════════════════════════════════════════════

const REWARD_POOLS = {
  // 55% - Simple acknowledgment (most common)
  acknowledgment: {
    weight: 55,
    messages: [
      "Done.",
      "Logged.",
      "✓",
      "Check.",
      "One more rep.",
      "Noted.",
    ],
  },
  
  // 20% - Identity reinforcement
  identity: {
    weight: 20,
    messages: [
      "One more vote for who you're becoming.",
      "This is who you are now.",
      "Notice: You didn't negotiate with yourself.",
      "The person who started would be proud.",
      "You're not trying anymore. You're just doing.",
      "This is becoming automatic.",
    ],
  },
  
  // 15% - Pattern insight (contextual)
  pattern: {
    weight: 15,
    templates: [
      "That's {streak} in a row. The pathway strengthens.",
      "{streak} days. Your neurons are rewiring.",
      "Day {streak}. This is past habit—it's becoming identity.",
      "Morning win. Your best time to build.",
      "Faster than yesterday. The resistance is fading.",
      "Completed before {time}. A pattern emerges.",
    ],
  },
  
  // 7% - Neuroscience insight
  science: {
    weight: 7,
    messages: [
      "Your basal ganglia just got a little stronger.",
      "Dopamine spike → future craving for this → habit loop forming.",
      "Each rep myelinates the neural pathway.",
      "Your prefrontal cortex thanks you. Less willpower needed tomorrow.",
      "The habit circuit: cue → routine → reward. You just completed it.",
    ],
  },
  
  // 3% - Rare delight (memorable)
  delight: {
    weight: 3,
    messages: [
      "🎯",
      "Your future self just sent you a thank you note.",
      "Somewhere, your inner critic has nothing to say.",
      "Plot twist: you actually did the thing.",
      "Achievement unlocked: Being a person who does things.",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// REWARD SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get a weighted random reward type
 */
const selectRewardType = (recentRewards = []) => {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  // Adjust weights based on recent rewards (avoid repetition)
  const adjustedPools = { ...REWARD_POOLS };
  
  // Slightly reduce weight of recently shown types
  recentRewards.slice(0, 3).forEach(recent => {
    if (adjustedPools[recent]) {
      adjustedPools[recent] = {
        ...adjustedPools[recent],
        weight: Math.max(1, adjustedPools[recent].weight * 0.5),
      };
    }
  });
  
  // Recalculate total weight
  const totalWeight = Object.values(adjustedPools).reduce((sum, pool) => sum + pool.weight, 0);
  const normalizedRandom = (random / 100) * totalWeight;
  
  for (const [type, pool] of Object.entries(adjustedPools)) {
    cumulative += pool.weight;
    if (normalizedRandom <= cumulative) {
      return type;
    }
  }
  
  return 'acknowledgment'; // Fallback
};

/**
 * Get a reward message for the given context
 */
export const getCompletionReward = (context = {}) => {
  const { 
    streak = 0, 
    habitName = 'this',
    timeOfDay = 'day',
    recentRewards = [],
  } = context;
  
  const type = selectRewardType(recentRewards);
  const pool = REWARD_POOLS[type];
  
  let message;
  
  if (pool.templates) {
    // Pattern-based messages need variable substitution
    const template = pool.templates[Math.floor(Math.random() * pool.templates.length)];
    const hour = new Date().getHours();
    const time = hour < 12 ? 'noon' : hour < 17 ? '5pm' : 'evening';
    
    message = template
      .replace('{streak}', streak)
      .replace('{habit}', habitName)
      .replace('{time}', time);
  } else {
    message = pool.messages[Math.floor(Math.random() * pool.messages.length)];
  }
  
  return {
    type,
    message,
    shouldShow: true, // Can be used to conditionally skip showing
  };
};

/**
 * Determine if we should show a reward (not every completion)
 */
export const shouldShowReward = (context = {}) => {
  const { 
    completionsToday = 0,
    totalCompletions = 0,
  } = context;
  
  // Always show for first 3 completions of the day
  if (completionsToday <= 3) return true;
  
  // 60% chance after that
  if (Math.random() < 0.6) return true;
  
  // Always show on milestone completions
  if (totalCompletions % 10 === 0) return true;
  
  return false;
};

// ═══════════════════════════════════════════════════════════════
// MILESTONE REWARDS (Separate from variable rewards)
// ═══════════════════════════════════════════════════════════════

export const MILESTONE_REWARDS = [
  { 
    day: 3, 
    title: 'First Summit',
    message: "Three days. The hardest part—starting—is behind you.",
    icon: '🏕️',
  },
  { 
    day: 7, 
    title: 'Base Camp',
    message: "One week. Neural encoding has begun. This is becoming a pattern, not an act of will.",
    icon: '⛺',
  },
  { 
    day: 14, 
    title: 'Camp I',
    message: "Two weeks. Your brain is adapting. The same action requires less effort than day one.",
    icon: '🚩',
  },
  { 
    day: 21, 
    title: 'Camp II',
    message: "Three weeks. The old research said 21 days makes a habit. That's a myth—but you're building something real.",
    icon: '⛰️',
  },
  { 
    day: 30, 
    title: 'Camp III',
    message: "One month. If you stopped now, you'd feel the absence. That's identity formation.",
    icon: '🏔️',
  },
  { 
    day: 45, 
    title: 'High Camp',
    message: "45 days. Most people never make it this far. You're not most people anymore.",
    icon: '🌄',
  },
  { 
    day: 60, 
    title: 'Summit',
    message: "60 days. This isn't something you do. It's who you are. The summit isn't the end—it's the view.",
    icon: '🏆',
  },
  { 
    day: 90, 
    title: 'Beyond the Summit',
    message: "90 days. Automaticity. The habit runs itself. Your job now is just to show up.",
    icon: '✨',
  },
];

/**
 * Check if user has reached a new milestone
 */
export const checkMilestone = (currentStreak, unlockedMilestones = []) => {
  for (const milestone of MILESTONE_REWARDS) {
    if (currentStreak >= milestone.day && !unlockedMilestones.includes(milestone.day)) {
      return milestone;
    }
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// CELEBRATION ANIMATIONS (for haptics/visuals)
// ═══════════════════════════════════════════════════════════════

export const CELEBRATION_TYPES = {
  // Most common: subtle
  subtle: {
    weight: 70,
    haptic: 'light',
    animation: 'pulse',
    duration: 200,
  },
  // Sometimes: medium
  medium: {
    weight: 20,
    haptic: 'medium',
    animation: 'expand',
    duration: 300,
  },
  // Rare: special
  special: {
    weight: 10,
    haptic: 'heavy',
    animation: 'burst',
    duration: 400,
  },
};

/**
 * Get celebration type for completion
 */
export const getCelebrationType = () => {
  const random = Math.random() * 100;
  
  if (random < CELEBRATION_TYPES.subtle.weight) {
    return CELEBRATION_TYPES.subtle;
  }
  if (random < CELEBRATION_TYPES.subtle.weight + CELEBRATION_TYPES.medium.weight) {
    return CELEBRATION_TYPES.medium;
  }
  return CELEBRATION_TYPES.special;
};
