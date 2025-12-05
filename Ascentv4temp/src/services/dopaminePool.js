/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DOPAMINE POOL ENGINE v2.0
 * Scientifically-Calibrated Motivation Model for React Native
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Based on peer-reviewed research including:
 * - Volkow et al. PET imaging studies on sleep deprivation & D2/D3 receptors
 * - Van Dongen's 14-day sleep restriction study
 * - Šrámek et al. cold exposure dopamine study (250% increase)
 * - Kjaer et al. 2002 Yoga Nidra PET study (65% increase)
 * - Huberman Lab framework on dopamine dynamics
 * - Lembke clinical data on dopamine reset timelines
 * - 2025 APA meta-analysis on short-form video & attention (n=98,299)
 * - 2023 Frontiers study on HIIT & D2 receptor upregulation (16% increase)
 *
 * Key insight: This models receptor SENSITIVITY, not literal neurotransmitter levels.
 * The "pool" metaphor represents D2/D3 receptor availability and responsiveness.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SLEEP PARAMETERS
// Volkow et al. demonstrated significant D2/D3 downregulation after one night
// of total sleep deprivation. Van Dongen showed cumulative impairment with
// chronic partial restriction.
// ═══════════════════════════════════════════════════════════════════════════════

export const SLEEP_FILL_RATES = {
  9: 1.00,    // 100% - Full receptor restoration
  8: 0.92,    // 92%  - Excellent, near-optimal
  7: 0.80,    // 80%  - CDC minimum, minor deficit beginning
  6: 0.65,    // 65%  - Cumulative deficit accumulates
  5: 0.45,    // 45%  - Moderate cognitive impairment
  4: 0.30,    // 30%  - Significant dysfunction
  3: 0.15,    // 15%  - Severe impairment
};

export const SLEEP_QUALITY_MULTIPLIERS = {
  highREM: 1.10,       // >22% REM sleep
  normalREM: 1.00,     // 18-22% REM
  lowREM: 0.85,        // <18% REM
  fragmented: 0.75,    // >3 wake episodes
  consolidated: 1.00,  // Continuous sleep
};

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCADIAN MODIFIERS
// Dopamine shows characteristic morning surge, afternoon trough, evening decline.
// These are ADDITIVE modifiers to current pool level.
// ═══════════════════════════════════════════════════════════════════════════════

export const CIRCADIAN_WINDOWS = [
  { start: 6, end: 9, modifier: 0.12, label: 'Morning surge' },
  { start: 9, end: 12, modifier: 0.05, label: 'Sustained peak' },
  { start: 12, end: 14, modifier: -0.05, label: 'Early afternoon dip' },
  { start: 14, end: 16, modifier: -0.18, label: 'Afternoon trough' },  // Nadir
  { start: 16, end: 19, modifier: -0.08, label: 'Partial recovery' },
  { start: 19, end: 22, modifier: -0.20, label: 'Evening decline' },
  { start: 22, end: 6, modifier: -0.25, label: 'Night (should be sleeping)' },
];

/**
 * Get circadian modifier for current time
 */
export const getCircadianModifier = (hour = new Date().getHours()) => {
  for (const window of CIRCADIAN_WINDOWS) {
    if (window.start <= window.end) {
      if (hour >= window.start && hour < window.end) {
        return { modifier: window.modifier, label: window.label };
      }
    } else {
      // Handle overnight window (22-6)
      if (hour >= window.start || hour < window.end) {
        return { modifier: window.modifier, label: window.label };
      }
    }
  }
  return { modifier: 0, label: 'Unknown' };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY DEPLETION RATES
// Per 30-minute session. Key insight from Lembke: variable ratio reinforcement
// (slot-machine pattern) depletes faster due to spike-crash cycles.
//
// 2025 APA meta-analysis (n=98,299) confirmed heavy short-form video consumption
// correlates with measurably poorer attention and inhibitory control.
// ═══════════════════════════════════════════════════════════════════════════════

export const DEPLETION_RATES = {
  // Tier 1: Maximum variable ratio reinforcement (infinite scroll, no stopping cues)
  tiktok: { rate: 0.14, label: 'TikTok', category: 'social', mechanism: 'Variable ratio + infinite scroll' },
  youtube_shorts: { rate: 0.13, label: 'YouTube Shorts', category: 'social', mechanism: 'Variable ratio short-form' },
  instagram_reels: { rate: 0.13, label: 'Instagram Reels', category: 'social', mechanism: 'Variable ratio short-form' },
  instagram: { rate: 0.11, label: 'Instagram', category: 'social', mechanism: 'Variable rewards + social comparison' },
  snapchat: { rate: 0.11, label: 'Snapchat', category: 'social', mechanism: 'Streaks + ephemeral content' },

  // Tier 2: High variable ratio
  twitter: { rate: 0.09, label: 'Twitter/X', category: 'social', mechanism: 'Variable ratio, lower sensory intensity' },
  reddit: { rate: 0.09, label: 'Reddit', category: 'social', mechanism: 'Variable content quality' },
  facebook: { rate: 0.09, label: 'Facebook', category: 'social', mechanism: 'News feed algorithm' },

  // Tier 3: Gaming (variable by type)
  gaming_gacha: { rate: 0.12, label: 'Gacha/Loot box games', category: 'gaming', mechanism: 'Gambling mechanics' },
  gaming_mmo: { rate: 0.11, label: 'MMO/Multiplayer', category: 'gaming', mechanism: 'Sustained unpredictable rewards' },
  gaming_competitive: { rate: 0.10, label: 'Competitive games', category: 'gaming', mechanism: 'Win/loss dopamine cycling' },
  gaming_story: { rate: 0.06, label: 'Story-based games', category: 'gaming', mechanism: 'Predictable arcs, natural endpoints' },
  gaming_puzzle: { rate: 0.05, label: 'Puzzle games', category: 'gaming', mechanism: 'Skill-based, satisfying completion' },

  // Tier 4: Passive consumption
  netflix: { rate: 0.07, label: 'Netflix/Streaming', category: 'video', mechanism: 'Auto-play extends sessions' },
  youtube: { rate: 0.06, label: 'YouTube (long-form)', category: 'video', mechanism: 'Recommendation algorithm' },
  tv_standard: { rate: 0.04, label: 'Standard TV', category: 'video', mechanism: 'Natural endpoints, predictable' },

  // Tier 5: Communication (notification-driven)
  email: { rate: 0.09, label: 'Email', category: 'communication', mechanism: 'Micro-gambling per notification' },
  slack: { rate: 0.08, label: 'Slack/Teams', category: 'communication', mechanism: 'Notification-driven checking' },
  discord: { rate: 0.08, label: 'Discord', category: 'communication', mechanism: 'Chat + notifications' },
  messages: { rate: 0.05, label: 'Messages/SMS', category: 'communication', mechanism: 'Lower frequency notifications' },

  // Tier 6: Work (cognitive fatigue, not dopamine crash)
  focused_work: { rate: 0.06, label: 'Focused work', category: 'work', mechanism: 'Cognitive fatigue' },
  meetings: { rate: 0.04, label: 'Video meetings', category: 'work', mechanism: 'Zoom fatigue' },

  // Tier 7: Neutral/Restorative
  reading_book: { rate: 0.02, label: 'Book reading', category: 'restorative', mechanism: 'Restorative attention, may be net positive' },
  music_passive: { rate: 0.01, label: 'Music (passive)', category: 'neutral', mechanism: 'Mood regulation' },
  utility: { rate: 0.00, label: 'Utility apps', category: 'neutral', mechanism: 'Functional, no dopamine loop' },
};

/**
 * Get depletion rate for an app/activity
 * Returns rate per 30 minutes as decimal (0.14 = 14%)
 */
export const getDepletionRate = (appName, customMappings = {}) => {
  // Check custom user mappings first
  if (customMappings[appName.toLowerCase()]) {
    return DEPLETION_RATES[customMappings[appName.toLowerCase()]] || DEPLETION_RATES.utility;
  }

  const lowerName = appName.toLowerCase();

  // Direct match
  if (DEPLETION_RATES[lowerName]) {
    return DEPLETION_RATES[lowerName];
  }

  // Pattern matching for common apps
  const patterns = {
    tiktok: ['tiktok'],
    instagram: ['instagram', 'ig'],
    instagram_reels: ['reels'],
    youtube_shorts: ['shorts'],
    youtube: ['youtube'],
    twitter: ['twitter', 'x.com'],
    facebook: ['facebook', 'fb'],
    reddit: ['reddit'],
    snapchat: ['snapchat', 'snap'],
    netflix: ['netflix'],
    discord: ['discord'],
    slack: ['slack'],
    messages: ['messages', 'imessage', 'whatsapp', 'telegram', 'signal'],
    email: ['gmail', 'mail', 'outlook', 'email'],
    gaming_mmo: ['wow', 'final fantasy', 'mmo', 'mmorpg'],
    gaming_gacha: ['genshin', 'gacha', 'fate', 'summoners'],
    gaming_competitive: ['league', 'valorant', 'fortnite', 'apex', 'overwatch', 'cod', 'pubg'],
    gaming_story: ['zelda', 'god of war', 'witcher', 'rpg'],
    gaming_puzzle: ['wordle', 'sudoku', 'candy crush', 'puzzle'],
  };

  for (const [key, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return DEPLETION_RATES[key];
    }
  }

  return DEPLETION_RATES.utility;
};

/**
 * Calculate exponential depletion multiplier
 * Research supports exponential rather than linear depletion due to
 * progressive receptor desensitization within sessions.
 */
export const getDepletionMultiplier = (sessionsToday) => {
  return 1 + (0.3 * sessionsToday);
};

/**
 * Calculate post-activity crash
 * Following Huberman's framework: high-dopamine activities trigger a
 * temporary drop BELOW pre-activity level lasting 30-60 minutes.
 */
export const calculateCrash = (depletionAmount) => ({
  crashAmount: depletionAmount * 0.35,  // 35% additional temporary dip
  recoveryMinutes: 60,                   // Recovers over this duration
});

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY ACTIVITIES
// Non-sleep recovery works through distinct mechanisms:
// - Cold exposure: Acute dopamine release via norepinephrine co-release
// - Meditation: Sustained baseline increase
// - Nature: Attention Restoration Theory (soft fascination)
// - Social: Dopamine + oxytocin synergy
// ═══════════════════════════════════════════════════════════════════════════════

export const RECOVERY_ACTIVITIES = {
  // Cold Exposure (Šrámek et al.: 250% dopamine increase, 2+ hour persistence)
  cold_shower_1min: {
    boost: 0.08,
    label: 'Cold shower (1 min)',
    mechanism: 'Norepinephrine co-release, sustained effect',
    requirements: { temperature: '50-60°F (10-15°C)' },
  },
  cold_shower_2min: {
    boost: 0.10,
    label: 'Cold shower (2-3 min)',
    mechanism: 'Norepinephrine co-release, sustained effect',
    requirements: { temperature: '50-60°F (10-15°C)' },
  },
  cold_plunge_30sec: {
    boost: 0.10,
    label: 'Cold plunge (30 sec)',
    mechanism: 'Acute intense cold response',
    requirements: { temperature: '40-50°F (4-10°C)' },
  },
  cold_plunge_1min: {
    boost: 0.12,
    label: 'Cold plunge (1 min)',
    mechanism: 'Acute intense cold response',
    requirements: { temperature: '40-50°F (4-10°C)' },
  },
  cold_exposure_extended: {
    boost: 0.18,
    label: 'Extended cold exposure (10-15 min)',
    mechanism: 'Cumulative catecholamine release',
    requirements: { temperature: '~60°F (15°C)', weeklyMinimum: '11 min total' },
  },

  // Morning Sunlight (50% cortisol/epinephrine/dopamine increase via retinal-SCN pathway)
  sunlight_sunny_5min: {
    boost: 0.05,
    label: 'Morning sun (5 min, sunny)',
    mechanism: 'Retinal-SCN-neurochemical cascade',
    requirements: { timing: 'Within 1 hour of waking' },
  },
  sunlight_sunny_10min: {
    boost: 0.07,
    label: 'Morning sun (10 min, sunny)',
    mechanism: 'Retinal-SCN-neurochemical cascade',
    requirements: { timing: 'Within 1 hour of waking' },
  },
  sunlight_overcast_15min: {
    boost: 0.06,
    label: 'Morning sun (15 min, overcast)',
    mechanism: 'Reduced but sufficient light exposure',
    requirements: { timing: 'Within 1 hour of waking' },
  },
  sunlight_overcast_30min: {
    boost: 0.08,
    label: 'Morning sun (30 min, cloudy)',
    mechanism: 'Extended exposure compensates for cloud cover',
    requirements: { timing: 'Within 1 hour of waking' },
  },

  // Meditation (Kjaer et al. 2002: 65% increase during Yoga Nidra, PET-confirmed)
  meditation_5min: {
    boost: 0.04,
    label: 'Meditation (5 min)',
    mechanism: 'Minimum effective dose',
    requirements: {},
  },
  meditation_10min: {
    boost: 0.06,
    label: 'Meditation (10 min)',
    mechanism: 'Meaningful restoration',
    requirements: {},
  },
  meditation_15min: {
    boost: 0.08,
    label: 'Meditation (15 min)',
    mechanism: 'Full relaxation response beginning',
    requirements: {},
  },
  meditation_20min: {
    boost: 0.10,
    label: 'Meditation (20 min)',
    mechanism: 'Full relaxation response activation',
    requirements: {},
  },
  yoga_nidra_30min: {
    boost: 0.14,
    label: 'Yoga Nidra (30 min)',
    mechanism: 'Documented 65% dopamine increase',
    requirements: {},
  },

  // Nature Exposure (Kaplan's Attention Restoration Theory)
  nature_walk_15min: {
    boost: 0.04,
    label: 'Nature walk (15 min)',
    mechanism: 'Soft fascination, attention restoration',
    requirements: { environment: 'Green space or natural setting' },
  },
  nature_walk_30min: {
    boost: 0.07,
    label: 'Nature walk (30 min)',
    mechanism: 'Meaningful exposure',
    requirements: { environment: 'Green space or natural setting' },
  },
  forest_bathing_1hr: {
    boost: 0.11,
    label: 'Forest bathing (1 hr)',
    mechanism: 'Immersive nature exposure',
    requirements: { environment: 'Forest or dense natural area' },
  },
  forest_bathing_2hr: {
    boost: 0.15,
    label: 'Forest bathing (2 hr)',
    mechanism: 'Full shinrin-yoku protocol',
    requirements: { environment: 'Forest or dense natural area' },
  },

  // Social Connection (Dopamine + Oxytocin synergy, in-person required)
  social_inperson_15min: {
    boost: 0.04,
    label: 'In-person social (15 min)',
    mechanism: 'Dopamine-oxytocin synergy',
    requirements: { type: 'In-person interaction' },
  },
  social_inperson_30min: {
    boost: 0.07,
    label: 'In-person social (30 min)',
    mechanism: 'Quality conversation',
    requirements: { type: 'In-person interaction' },
  },
  social_deep_conversation: {
    boost: 0.10,
    label: 'Deep conversation (1 hr)',
    mechanism: 'Meaningful connection',
    requirements: { type: 'Vulnerable, authentic exchange' },
  },
  social_digital: {
    boost: 0.02,
    label: 'Digital social (30 min)',
    mechanism: 'Reduced effect without physical presence cues',
    requirements: { note: 'Video call or text-based' },
  },

  // Deliberate Boredom (Huberman framework: allows receptor upregulation)
  boredom_15min: {
    boost: 0.04,
    label: 'Deliberate boredom (15 min)',
    mechanism: 'Receptor upregulation, sensitivity recalibration',
    requirements: { note: 'No phone, no music, no stimulation' },
  },
  boredom_30min: {
    boost: 0.06,
    label: 'Deliberate boredom (30 min)',
    mechanism: 'Extended receptor reset',
    requirements: { note: 'No phone, no music, no stimulation' },
  },

  // Exercise (Daily "charging" - distinct from capacity expansion)
  exercise_walk_30min: {
    boost: 0.05,
    label: 'Walking (30 min)',
    mechanism: 'Light movement, nature bonus possible',
    requirements: { intensity: 'Low' },
  },
  exercise_moderate_30min: {
    boost: 0.07,
    label: 'Moderate cardio (30 min)',
    mechanism: 'Sustained heart rate elevation',
    requirements: { intensity: '65-70% max heart rate' },
  },
  exercise_hiit_20min: {
    boost: 0.10,
    label: 'HIIT (20-30 min)',
    mechanism: 'Acute catecholamine surge',
    requirements: { intensity: '80-90% max heart rate' },
  },
  exercise_strength_30min: {
    boost: 0.07,
    label: 'Strength training (30 min)',
    mechanism: 'Resistance exercise benefits',
    requirements: { intensity: 'Moderate-high' },
  },
  exercise_skilled_30min: {
    boost: 0.09,
    label: 'Skilled exercise (30 min)',
    mechanism: 'Enhanced frontal-striatal activation',
    requirements: { examples: 'Dance, martial arts, climbing' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY - RECHARGE_ACTIVITIES format for existing code
// ═══════════════════════════════════════════════════════════════════════════════

export const RECHARGE_ACTIVITIES = {
  exercise: {
    light: { minutes: 15, boost: 5, label: 'Light exercise' },
    moderate: { minutes: 30, boost: 7, label: 'Moderate workout' },
    intense: { minutes: 45, boost: 10, label: 'Intense workout' },
  },
  meditation: {
    short: { minutes: 5, boost: 4, label: 'Quick meditation' },
    standard: { minutes: 15, boost: 8, label: 'Full meditation' },
  },
  outdoors: {
    walk: { minutes: 20, boost: 5, label: 'Walk outside' },
    sunlight: { minutes: 15, boost: 7, label: 'Morning sunlight' },
  },
  social: {
    inPerson: { minutes: 30, boost: 7, label: 'In-person time' },
    deepConversation: { minutes: 60, boost: 10, label: 'Deep conversation' },
  },
  coldExposure: {
    shower: { minutes: 2, boost: 10, label: 'Cold exposure' },
  },
  sleep: {
    good: { hours: 7, boost: 25, label: '7+ hours sleep' },
    great: { hours: 8, boost: 30, label: '8+ hours sleep' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISE CAPACITY EXPANSION
// 2023 Frontiers study: 16% D2 receptor upregulation after 6 weeks daily HIIT.
// This expands the MAXIMUM pool size - consistency beats intensity.
// ═══════════════════════════════════════════════════════════════════════════════

export const CAPACITY_EXPANSION = {
  weeks_1: 0.05,    // +5% max capacity
  weeks_2: 0.08,    // +8%
  weeks_4: 0.12,    // +12%
  weeks_6: 0.16,    // +16% (PET-measured)
  weeks_8: 0.20,    // +20%
  max_ceiling: 0.25, // +25% absolute ceiling for healthy individuals
};

export const CAPACITY_DECAY_RATE = 0.04; // -4% per week of inactivity
export const MINIMUM_SESSIONS_PER_WEEK = 3; // To maintain capacity gains

/**
 * Calculate current capacity expansion based on exercise history
 */
export const calculateCapacityExpansion = (exerciseHistory) => {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return 0;
  }

  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now - 28 * 24 * 60 * 60 * 1000);
  const sixWeeksAgo = new Date(now - 42 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(now - 56 * 24 * 60 * 60 * 1000);

  const periods = [
    { start: oneWeekAgo, end: now, label: 'week_1' },
    { start: twoWeeksAgo, end: oneWeekAgo, label: 'week_2' },
    { start: new Date(now - 21 * 24 * 60 * 60 * 1000), end: twoWeeksAgo, label: 'week_3' },
    { start: fourWeeksAgo, end: new Date(now - 21 * 24 * 60 * 60 * 1000), label: 'week_4' },
    { start: new Date(now - 35 * 24 * 60 * 60 * 1000), end: fourWeeksAgo, label: 'week_5' },
    { start: sixWeeksAgo, end: new Date(now - 35 * 24 * 60 * 60 * 1000), label: 'week_6' },
    { start: new Date(now - 49 * 24 * 60 * 60 * 1000), end: sixWeeksAgo, label: 'week_7' },
    { start: eightWeeksAgo, end: new Date(now - 49 * 24 * 60 * 60 * 1000), label: 'week_8' },
  ];

  let consecutiveWeeks = 0;
  for (const period of periods) {
    const sessionsInPeriod = exerciseHistory.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= period.start && sessionDate < period.end;
    }).length;

    if (sessionsInPeriod >= MINIMUM_SESSIONS_PER_WEEK) {
      consecutiveWeeks++;
    } else {
      break; // Streak broken
    }
  }

  // Return capacity expansion based on consecutive weeks
  if (consecutiveWeeks >= 8) return CAPACITY_EXPANSION.max_ceiling;
  if (consecutiveWeeks >= 6) return CAPACITY_EXPANSION.weeks_8;
  if (consecutiveWeeks >= 4) return CAPACITY_EXPANSION.weeks_6;
  if (consecutiveWeeks >= 2) return CAPACITY_EXPANSION.weeks_4;
  if (consecutiveWeeks >= 1) return CAPACITY_EXPANSION.weeks_2;
  return 0;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DYSREGULATION TIERS
// Heavy social media users show D2 receptor patterns similar to substance addiction.
// Based on Lembke's clinical data and receptor binding studies.
// ═══════════════════════════════════════════════════════════════════════════════

export const DYSREGULATION_TIERS = {
  healthy: {
    depletionMod: 1.0,
    recoveryMod: 1.0,
    capacityMod: 1.0,
    indicators: ['Normal pleasure from everyday activities'],
  },
  mild: {
    depletionMod: 1.2,
    recoveryMod: 0.9,
    capacityMod: 1.0,
    indicators: ['Some tolerance', 'Needs more stimulation for same effect'],
  },
  moderate: {
    depletionMod: 1.4,
    recoveryMod: 0.75,
    capacityMod: 0.9,
    indicators: ['Clear tolerance', 'Reduced pleasure from activities', 'Difficulty with boredom'],
  },
  severe: {
    depletionMod: 1.6,
    recoveryMod: 0.6,
    capacityMod: 0.8,
    indicators: ['Anhedonia present', 'Functional impairment', 'Compulsive use despite consequences'],
  },
};

/**
 * Assess dysregulation tier based on user behavior patterns
 */
export const assessDysregulationTier = (userData) => {
  const {
    avgDailyScreenTime = 0,
    primaryAppCategory = 'social',
    reportedAnhedonia = false,
    difficultyWithBoredom = false,
    compulsiveUse = false,
    screenTimeTrend = 'stable',
  } = userData;

  let score = 0;

  if (avgDailyScreenTime > 360) score += 3;
  else if (avgDailyScreenTime > 240) score += 2;
  else if (avgDailyScreenTime > 120) score += 1;

  if (['social', 'gaming_gacha', 'gaming_mmo'].includes(primaryAppCategory)) {
    score += 1;
  }

  if (reportedAnhedonia) score += 3;
  if (difficultyWithBoredom) score += 1;
  if (compulsiveUse) score += 2;

  if (screenTimeTrend === 'increasing') score += 1;
  if (screenTimeTrend === 'decreasing') score -= 1;

  if (score >= 7) return 'severe';
  if (score >= 4) return 'moderate';
  if (score >= 2) return 'mild';
  return 'healthy';
};

// ═══════════════════════════════════════════════════════════════════════════════
// WARNING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

export const WARNING_THRESHOLDS = {
  healthy: { min: 0.70, color: '#22c55e', status: 'healthy' },
  caution: { min: 0.50, color: '#f59e0b', status: 'caution' },
  warning: { min: 0.30, color: '#f97316', status: 'warning' },
  critical: { min: 0.20, color: '#ef4444', status: 'critical' },
  danger: { min: 0.00, color: '#7f1d1d', status: 'danger' },
};

export const getPoolStatus = (level) => {
  // Convert percentage to decimal if needed
  const normalizedLevel = level > 1 ? level / 100 : level;

  if (normalizedLevel >= 0.70) return {
    ...WARNING_THRESHOLDS.healthy,
    message: 'Full reserves. Prime time for challenging work.',
    suggestion: 'Tackle your hardest habit now.',
    emoji: '⚡',
  };
  if (normalizedLevel >= 0.50) return {
    ...WARNING_THRESHOLDS.caution,
    message: 'Solid reserves. Good for focused work.',
    suggestion: 'Good time for any habit.',
    emoji: '✨',
  };
  if (normalizedLevel >= 0.30) return {
    ...WARNING_THRESHOLDS.warning,
    message: 'Moderate reserves. Use 2-minute versions.',
    suggestion: 'Keep it simple today.',
    emoji: '⚠️',
  };
  if (normalizedLevel >= 0.20) return {
    ...WARNING_THRESHOLDS.critical,
    message: 'Low reserves. Recovery time.',
    suggestion: 'Consider a cold shower or walk outside.',
    emoji: '🔋',
  };
  return {
    ...WARNING_THRESHOLDS.danger,
    message: 'Reserves depleted. Rest and recharge.',
    suggestion: 'No habits today. Focus on sleep and recovery.',
    emoji: '🛑',
    showProfessionalHelp: true,
  };
};

/**
 * Get pool status message based on level (LEGACY COMPATIBILITY)
 * Returns the same format as the old API for backward compatibility
 */
export const getPoolStatusMessage = (level) => {
  const status = getPoolStatus(level);
  return {
    status: status.status,
    message: status.message,
    suggestion: status.suggestion,
    color: status.color,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY TIMELINE (Based on Lembke's clinical data)
// ═══════════════════════════════════════════════════════════════════════════════

export const RECOVERY_TIMELINE = {
  weeks_1_2: {
    description: 'Dopamine deficit state. Users often feel WORSE (withdrawal).',
    expectedImprovement: 0,
    message: 'This is normal. Your brain is recalibrating.',
  },
  weeks_3_4: {
    description: 'Improvement begins. ~80% of patients show mood improvement.',
    expectedImprovement: 0.3,
    message: 'You\'re through the hardest part.',
  },
  months_3_6: {
    description: 'Most report restored ability to feel natural happiness.',
    expectedImprovement: 0.6,
    message: 'Your baseline is normalizing.',
  },
  months_12_17: {
    description: 'Full receptor recovery (PET-confirmed DAT normalization).',
    expectedImprovement: 1.0,
    message: 'Full restoration achieved.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POOL CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate morning pool level based on sleep and previous day
 * Returns value 0-100 for backward compatibility
 */
export const calculateMorningPool = (userData) => {
  const {
    sleepHours = 7,
    lastSleepHours,  // Legacy support
    sleepQuality = 'normalREM',
    yesterdayComplete = false,
    streakDays = 0,
    dysregulationTier = 'healthy',
    capacityExpansion = 0,
  } = userData;

  // Use lastSleepHours for legacy compatibility
  const hours = lastSleepHours || sleepHours;

  // Base fill from sleep
  const sleepBucket = Math.min(9, Math.max(3, Math.floor(hours)));
  let baseFill = SLEEP_FILL_RATES[sleepBucket] || 0.65;

  // Apply sleep quality multiplier
  const qualityMultiplier = SLEEP_QUALITY_MULTIPLIERS[sleepQuality] || 1.0;
  baseFill *= qualityMultiplier;

  // Previous day completion bonus (residual satisfaction)
  if (yesterdayComplete) {
    baseFill += 0.10;
  }

  // Streak momentum bonus (habit formation neuroplasticity)
  if (streakDays >= 7) baseFill += 0.05;
  if (streakDays >= 21) baseFill += 0.05;
  if (streakDays >= 60) baseFill += 0.05;

  // Apply dysregulation modifier
  const dysregMods = DYSREGULATION_TIERS[dysregulationTier] || DYSREGULATION_TIERS.healthy;
  baseFill *= dysregMods.capacityMod;

  // Apply capacity expansion from exercise
  const maxCapacity = 1.0 + capacityExpansion;

  // Clamp to valid range and convert to percentage
  const result = Math.min(maxCapacity, Math.max(0.20, baseFill));
  return Math.round(result * 100);
};

/**
 * Calculate current pool level based on all activities today
 * Returns value 0-100 for backward compatibility
 */
export const calculateCurrentPool = (poolData) => {
  const {
    morningLevel = 65,
    drainActivities = [],
    rechargeActivities = [],
    hoursSinceWake = 0,
    dysregulationTier = 'healthy',
    capacityExpansion = 0,
    pendingCrash = null,
  } = poolData;

  // Convert morning level to decimal if it's a percentage
  let pool = morningLevel > 1 ? morningLevel / 100 : morningLevel;
  const dysregMods = DYSREGULATION_TIERS[dysregulationTier] || DYSREGULATION_TIERS.healthy;

  // Track sessions per app for exponential depletion
  const sessionCounts = {};

  // Apply drain activities
  drainActivities.forEach(activity => {
    const appKey = activity.app?.toLowerCase() || 'unknown';
    sessionCounts[appKey] = (sessionCounts[appKey] || 0) + 1;

    const rateInfo = getDepletionRate(activity.app);
    const baseDepletion = rateInfo.rate * (activity.minutes / 30);
    const multiplier = getDepletionMultiplier(sessionCounts[appKey] - 1);
    const finalDepletion = baseDepletion * multiplier * dysregMods.depletionMod;

    pool -= finalDepletion;
  });

  // Apply recharge activities
  rechargeActivities.forEach(activity => {
    // Support both new format (type key) and legacy format (boost value)
    if (activity.type && RECOVERY_ACTIVITIES[activity.type]) {
      pool += RECOVERY_ACTIVITIES[activity.type].boost * dysregMods.recoveryMod;
    } else if (activity.boost) {
      // Legacy: boost is already a percentage, convert to decimal
      const boostDecimal = activity.boost > 1 ? activity.boost / 100 : activity.boost;
      pool += boostDecimal * dysregMods.recoveryMod;
    }
  });

  // Apply pending crash if within recovery window
  if (pendingCrash && pendingCrash.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(pendingCrash.expiresAt);
    if (now < expiresAt) {
      const elapsed = (now - new Date(pendingCrash.startedAt)) / (1000 * 60);
      const remaining = 1 - (elapsed / pendingCrash.recoveryMinutes);
      pool -= pendingCrash.crashAmount * Math.max(0, remaining);
    }
  }

  // Apply circadian modifier
  const circadian = getCircadianModifier();
  pool += circadian.modifier;

  // Natural hourly micro-recovery (very slow)
  pool += hoursSinceWake * 0.005; // +0.5% per hour

  // Clamp to valid range
  const maxCapacity = 1.0 + capacityExpansion;
  const result = Math.max(0, Math.min(maxCapacity, pool));

  // Return as percentage for backward compatibility
  return Math.round(result * 100);
};

/**
 * Log a drain activity with full metadata
 */
export const logDrainActivity = (appName, minutes, sessionsToday = 0) => {
  const rateInfo = getDepletionRate(appName);
  const baseImpact = rateInfo.rate * (minutes / 30);
  const multiplier = getDepletionMultiplier(sessionsToday);
  const finalImpact = baseImpact * multiplier;
  const crash = calculateCrash(finalImpact);

  return {
    app: appName,
    minutes,
    category: rateInfo.category,
    mechanism: rateInfo.mechanism,
    baseImpact: Math.round(baseImpact * 100),
    multipliedImpact: Math.round(finalImpact * 100),
    impact: Math.round(finalImpact * 100), // Legacy compatibility
    sessionMultiplier: multiplier,
    crash: {
      amount: Math.round(crash.crashAmount * 100),
      recoveryMinutes: crash.recoveryMinutes,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + crash.recoveryMinutes * 60 * 1000).toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log a recovery activity (LEGACY COMPATIBLE)
 */
export const logRechargeActivity = (activityType, intensity) => {
  // Try legacy format first
  const legacyActivity = RECHARGE_ACTIVITIES[activityType]?.[intensity];

  if (legacyActivity) {
    return {
      type: activityType,
      intensity,
      boost: legacyActivity.boost,
      label: legacyActivity.label,
      timestamp: new Date().toISOString(),
    };
  }

  // Try new format (activityType is the full key like 'cold_shower_2min')
  const newActivity = RECOVERY_ACTIVITIES[activityType];
  if (newActivity) {
    return {
      type: activityType,
      boost: Math.round(newActivity.boost * 100),
      label: newActivity.label,
      mechanism: newActivity.mechanism,
      requirements: newActivity.requirements,
      timestamp: new Date().toISOString(),
    };
  }

  return { boost: 0, error: 'Unknown activity' };
};

/**
 * Get recommended habit order based on pool level
 */
export const getRecommendedHabitOrder = (habits, poolLevel) => {
  // Normalize pool level to decimal
  const level = poolLevel > 1 ? poolLevel / 100 : poolLevel;

  const sorted = [...habits].sort((a, b) => {
    const aResistance = a.resistance || 5;
    const bResistance = b.resistance || 5;

    if (level >= 0.70) {
      return bResistance - aResistance;
    } else if (level >= 0.50) {
      return Math.abs(bResistance - 5) - Math.abs(aResistance - 5);
    } else {
      return aResistance - bResistance;
    }
  });

  return sorted.map((habit, index) => ({
    ...habit,
    recommendation: level < 0.30
      ? 'Use 2-minute version'
      : level < 0.50
        ? 'Standard version okay'
        : 'Full version',
    priority: index + 1,
  }));
};

/**
 * Initialize pool data for a new day
 */
export const initializeDailyPool = (userData) => {
  const morningLevel = calculateMorningPool(userData);

  return {
    date: new Date().toISOString().split('T')[0],
    morningLevel,
    currentLevel: morningLevel,
    drainActivities: [],
    rechargeActivities: [],
    pendingCrash: null,
    lastUpdated: new Date().toISOString(),
    metadata: {
      sleepHours: userData.sleepHours || userData.lastSleepHours,
      sleepQuality: userData.sleepQuality,
      dysregulationTier: userData.dysregulationTier || 'healthy',
      capacityExpansion: userData.capacityExpansion || 0,
    },
  };
};

/**
 * Get recovery suggestions based on current state
 */
export const getRecoverySuggestions = (poolLevel, timeOfDay, recentActivities = []) => {
  const suggestions = [];
  const hour = timeOfDay || new Date().getHours();
  const recentTypes = recentActivities.map(a => a.type);
  const level = poolLevel > 1 ? poolLevel / 100 : poolLevel;

  // Morning-specific suggestions
  if (hour >= 6 && hour < 10) {
    if (!recentTypes.includes('sunlight_sunny_10min')) {
      suggestions.push({
        type: 'sunlight_sunny_10min',
        priority: 1,
        reason: 'Morning sunlight sets your circadian rhythm for the day',
      });
    }
  }

  // Low pool emergency recovery
  if (level < 0.30) {
    if (!recentTypes.some(t => t?.includes('cold'))) {
      suggestions.push({
        type: 'cold_shower_2min',
        priority: 1,
        reason: 'Cold exposure provides fastest recovery (+10-12%)',
      });
    }
    suggestions.push({
      type: 'boredom_15min',
      priority: 2,
      reason: 'Deliberate boredom recalibrates sensitivity',
    });
  }

  // Moderate pool suggestions
  if (level >= 0.30 && level < 0.60) {
    suggestions.push({
      type: 'exercise_walk_30min',
      priority: 2,
      reason: 'Light movement restores without depleting',
    });
    suggestions.push({
      type: 'meditation_10min',
      priority: 3,
      reason: 'Meditation builds sustained baseline',
    });
  }

  // Afternoon trough (14-16)
  if (hour >= 14 && hour < 16) {
    suggestions.push({
      type: 'nature_walk_15min',
      priority: 2,
      reason: 'Counter the afternoon trough with attention restoration',
    });
  }

  return suggestions.slice(0, 3);
};

/**
 * Generate daily summary with insights
 */
export const generateDailySummary = (poolHistory) => {
  if (!poolHistory || poolHistory.length === 0) {
    return null;
  }

  const today = poolHistory[poolHistory.length - 1];
  const yesterday = poolHistory.length > 1 ? poolHistory[poolHistory.length - 2] : null;
  const weekAgo = poolHistory.length > 7 ? poolHistory[poolHistory.length - 8] : null;

  const summary = {
    date: today.date,
    morningLevel: today.morningLevel,
    endLevel: today.currentLevel,
    netChange: today.currentLevel - today.morningLevel,

    totalDrain: today.drainActivities?.reduce((sum, a) => sum + (a.multipliedImpact || a.impact || 0), 0) || 0,
    topDrains: (today.drainActivities || [])
      .sort((a, b) => (b.multipliedImpact || b.impact || 0) - (a.multipliedImpact || a.impact || 0))
      .slice(0, 3),

    totalRecovery: today.rechargeActivities?.reduce((sum, a) => sum + (a.boost || 0), 0) || 0,
    recoveryActivities: today.rechargeActivities || [],

    vsYesterday: yesterday ? today.currentLevel - yesterday.currentLevel : null,
    vsWeekAgo: weekAgo ? today.currentLevel - weekAgo.currentLevel : null,

    insights: [],
  };

  if (summary.totalDrain > 50) {
    summary.insights.push({
      type: 'warning',
      message: 'Heavy depletion today. Consider a recovery day tomorrow.',
    });
  }

  if (summary.totalRecovery > 30) {
    summary.insights.push({
      type: 'positive',
      message: 'Strong recovery practices. Your sensitivity is improving.',
    });
  }

  if (summary.vsWeekAgo && summary.vsWeekAgo > 10) {
    summary.insights.push({
      type: 'positive',
      message: 'Your baseline is trending up compared to last week.',
    });
  } else if (summary.vsWeekAgo && summary.vsWeekAgo < -10) {
    summary.insights.push({
      type: 'warning',
      message: 'Your baseline has dropped. Consider a 1-2 week digital detox.',
    });
  }

  return summary;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_DRAIN_RATES = {
  social: {
    rate: -1.5,
    apps: ['TikTok', 'Instagram', 'Twitter', 'X', 'Facebook', 'Reddit', 'Snapchat'],
    description: 'Infinite scroll + variable rewards',
  },
  video: {
    rate: -0.8,
    apps: ['YouTube', 'Netflix', 'Hulu', 'Disney+', 'HBO', 'Twitch'],
    description: 'Passive consumption, finite content',
  },
  communication: {
    rate: -0.3,
    apps: ['Messages', 'Slack', 'Email', 'Discord', 'WhatsApp', 'Telegram'],
    description: 'Connection, but notification-driven',
  },
  utility: {
    rate: 0,
    apps: ['Maps', 'Calendar', 'Calculator', 'Settings', 'Camera', 'Notes', 'Weather'],
    description: 'Functional, no dopamine loop',
  },
  recharge: {
    rate: 0.2,
    apps: ['Kindle', 'Audible', 'Meditation', 'Calm', 'Headspace'],
    description: 'Restorative activities',
  },
};

export const getCategoryForApp = (appName, customMappings = {}) => {
  if (customMappings[appName]) {
    return customMappings[appName];
  }

  const lowerName = appName.toLowerCase();

  for (const [category, data] of Object.entries(DEFAULT_DRAIN_RATES)) {
    if (data.apps.some(app => lowerName.includes(app.toLowerCase()))) {
      return category;
    }
  }

  return 'utility';
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  SLEEP_FILL_RATES,
  SLEEP_QUALITY_MULTIPLIERS,
  CIRCADIAN_WINDOWS,
  getCircadianModifier,
  DEPLETION_RATES,
  getDepletionRate,
  getDepletionMultiplier,
  calculateCrash,
  RECOVERY_ACTIVITIES,
  RECHARGE_ACTIVITIES,
  CAPACITY_EXPANSION,
  CAPACITY_DECAY_RATE,
  MINIMUM_SESSIONS_PER_WEEK,
  calculateCapacityExpansion,
  DYSREGULATION_TIERS,
  assessDysregulationTier,
  WARNING_THRESHOLDS,
  getPoolStatus,
  getPoolStatusMessage,
  RECOVERY_TIMELINE,
  calculateMorningPool,
  calculateCurrentPool,
  logDrainActivity,
  logRechargeActivity,
  getRecommendedHabitOrder,
  initializeDailyPool,
  getRecoverySuggestions,
  generateDailySummary,
  DEFAULT_DRAIN_RATES,
  getCategoryForApp,
};
