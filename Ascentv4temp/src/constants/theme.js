// Theme system with dark mode support
// "Bioluminescent Depth" - Deep ocean aesthetic
// Identity-based design: no gamification, just quiet satisfaction

// ═══════════════════════════════════════════════════════════════
// BIOLUMINESCENT DARK THEME (Primary - spec-defined)
// Deep ocean aesthetic. The pool is a glowing vessel in darkness.
// ═══════════════════════════════════════════════════════════════
export const bioluminescentColors = {
  // Core backgrounds
  bgDeep: '#0a0a0f',           // Near-black with blue undertone
  bg: '#0a0a0f',               // Alias for consistency
  bg2: '#12121a',              // Card/surface color
  bg3: '#1a1a24',              // Elevated surfaces
  card: '#12121a',             // Card background
  cardElevated: '#1a1a24',     // Elevated card

  // Text hierarchy
  text: '#e8e8ec',             // Primary text (off-white)
  text2: '#9898a8',            // Secondary text
  text3: '#6b6b7a',            // Tertiary/muted text
  textMuted: '#4a4a58',        // Very muted

  // Pool colors (the hero)
  poolFull: '#00d4ff',         // Bright cyan when full
  poolMid: '#0088aa',          // Teal when moderate
  poolLow: '#ff6b35',          // Amber warning when low
  poolDepleted: '#ff3366',     // Red-pink when depleted
  poolGlow: '#00d4ff',         // Glow color
  poolGlowMid: '#0088aa',      // Glow when moderate
  poolGlowLow: '#ff6b35',      // Glow when low

  // Accent colors
  accent: '#7c3aed',           // Purple accent for habits
  accentLight: '#7c3aed20',    // Light purple bg
  accentBright: '#a78bfa',     // Brighter purple for highlights

  // Status colors
  success: '#22c55e',
  successLight: '#22c55e20',
  successGlow: '#22c55e',
  warning: '#ff6b35',
  warningLight: '#ff6b3520',
  danger: '#ff3366',
  dangerLight: '#ff336620',

  // Completion/streak colors
  complete: '#00d4ff',
  completeGlow: '#00d4ff40',
  streak: '#ff6b35',
  streakGlow: '#ff6b3540',

  // Ring colors
  ringEmpty: '#1a1a24',
  ringProgress: '#7c3aed',
  ringComplete: '#00d4ff',
  ringGlow: '#7c3aed40',

  // Heatmap colors (deep to bright)
  heatmap0: '#1a1a24',
  heatmap25: '#2a1a4a',
  heatmap50: '#4a2a7a',
  heatmap75: '#7c3aed',
  heatmap100: '#a78bfa',

  // Borders
  border: '#2a2a3a',
  borderLight: '#1a1a24',
  borderAccent: '#7c3aed40',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// ═══════════════════════════════════════════════════════════════
// LIGHT THEME (Secondary - for accessibility)
// ═══════════════════════════════════════════════════════════════
export const lightColors = {
  bgDeep: '#f8fafc',
  bg: '#f8fafc',
  bg2: '#f1f5f9',
  bg3: '#e2e8f0',
  card: '#ffffff',
  cardElevated: '#ffffff',
  text: '#0f172a',
  text2: '#475569',
  text3: '#94a3b8',
  textMuted: '#cbd5e1',

  // Pool colors
  poolFull: '#0ea5e9',
  poolMid: '#0284c7',
  poolLow: '#f59e0b',
  poolDepleted: '#ef4444',
  poolGlow: '#0ea5e9',
  poolGlowMid: '#0284c7',
  poolGlowLow: '#f59e0b',

  accent: '#7c3aed',
  accentLight: '#ede9fe',
  accentBright: '#8b5cf6',

  success: '#22c55e',
  successLight: '#dcfce7',
  successGlow: '#22c55e',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',

  complete: '#0ea5e9',
  completeGlow: '#0ea5e920',
  streak: '#f59e0b',
  streakGlow: '#f59e0b20',

  ringEmpty: '#e2e8f0',
  ringProgress: '#7c3aed',
  ringComplete: '#22c55e',
  ringGlow: '#7c3aed20',

  heatmap0: '#e2e8f0',
  heatmap25: '#dcfce7',
  heatmap50: '#86efac',
  heatmap75: '#22c55e',
  heatmap100: '#16a34a',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderAccent: '#7c3aed20',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// Default dark theme is bioluminescent
export const darkColors = bioluminescentColors;

// ═══════════════════════════════════════════════════════════════
// POOL LEVEL COLOR HELPERS
// ═══════════════════════════════════════════════════════════════
export const getPoolColor = (level, isDark = true) => {
  const colors = isDark ? bioluminescentColors : lightColors;
  if (level >= 70) return colors.poolFull;
  if (level >= 40) return colors.poolMid;
  if (level >= 20) return colors.poolLow;
  return colors.poolDepleted;
};

export const getPoolGlowColor = (level, isDark = true) => {
  const colors = isDark ? bioluminescentColors : lightColors;
  if (level >= 70) return colors.poolGlow;
  if (level >= 40) return colors.poolGlowMid;
  return colors.poolGlowLow;
};

export const getPoolGlowIntensity = (level) => {
  // Higher level = more glow
  if (level >= 70) return 1.0;
  if (level >= 50) return 0.7;
  if (level >= 30) return 0.4;
  return 0.2;
};

// ═══════════════════════════════════════════════════════════════
// STREAK COLORS - Based on depth forming, not achievement
// ═══════════════════════════════════════════════════════════════
export const getStreakColor = (days, isDark = true) => {
  const colors = isDark ? bioluminescentColors : lightColors;
  if (days < 7) return colors.text3;              // Neutral - just starting
  if (days < 14) return colors.warning;           // Warm - taking root
  if (days < 30) return '#ea580c';                // Warmer - deepening
  return '#c2410c';                               // Deep amber - part of you
};

// Consistency-based streak colors (new system)
export const getConsistencyColor = (percentage, isDark = true) => {
  const colors = isDark ? bioluminescentColors : lightColors;
  if (percentage >= 80) return colors.success;     // Solid
  if (percentage >= 60) return colors.warning;     // Building
  return colors.danger;                            // Rebuilding
};

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY - Spec defined
// ═══════════════════════════════════════════════════════════════
export const typography = {
  // Display (for pool level, major numbers)
  display: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Headers
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Labels/Captions
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Mono (for stats, numbers)
  mono: {
    fontFamily: 'monospace',
  },
  monoLarge: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '700',
  },
};

// ═══════════════════════════════════════════════════════════════
// SHARED VALUES
// ═══════════════════════════════════════════════════════════════
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Semantic spacing
  section: 40,
  card: 16,
  screenPadding: 20,
  listGap: 12,
};

// ═══════════════════════════════════════════════════════════════
// SHADOWS - Glow effects for dark theme
// ═══════════════════════════════════════════════════════════════
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Glow shadows for dark theme
export const glowShadows = {
  poolGlow: (color = '#00d4ff', intensity = 1) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6 * intensity,
    shadowRadius: 20,
    elevation: 10,
  }),
  accentGlow: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  successGlow: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  subtleGlow: (color = '#7c3aed') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  }),
};

export const darkShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
};

// ═══════════════════════════════════════════════════════════════
// ANIMATION CONSTANTS
// ═══════════════════════════════════════════════════════════════
export const animation = {
  // Pool animations
  waveFrequency: 2000,         // Wave cycle duration (ms)
  waveAmplitude: 4,            // Wave height (px)
  glowPulseFrequency: 4000,    // Glow pulse cycle (ms)
  glowPulseIntensity: 0.1,     // ±10% brightness oscillation
  drainDuration: 800,          // Drain animation (ms)
  refillDuration: 2000,        // Morning refill (ms)

  // UI animations
  tapScale: 0.95,
  tapDuration: 100,
  cardEnter: 300,
  modalEnter: 250,
  toastDuration: 3000,

  // Haptic patterns
  hapticTap: 'light',
  hapticSuccess: 'success',
  hapticWarning: 'warning',
  hapticError: 'error',
};

// ═══════════════════════════════════════════════════════════════
// QUOTES - Reframed for identity, not motivation
// ═══════════════════════════════════════════════════════════════
export const QUOTES = [
  { text: "We are what we repeatedly do.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements compound into remarkable results.", author: "Robin Sharma" },
  { text: "You fall to the level of your systems.", author: "James Clear" },
  { text: "The one who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation gets you started. Identity keeps you going.", author: "Unknown" },
  { text: "Every action is a vote for the person you wish to become.", author: "James Clear" },
  { text: "The path is made by walking.", author: "Antonio Machado" },
  { text: "How we spend our days is how we spend our lives.", author: "Annie Dillard" },
];

// ═══════════════════════════════════════════════════════════════
// MILESTONES - Reframed as acknowledgment, not achievement
// ═══════════════════════════════════════════════════════════════
export const MILESTONES = [
  { day: 7, name: 'Base Camp', icon: '⛺', message: 'One week of showing up. The foundation is forming.' },
  { day: 14, name: 'Camp 1', icon: '🏕️', message: 'Two weeks. Your neural pathways are adapting.' },
  { day: 30, name: 'Camp 2', icon: '🚩', message: 'One month. This is becoming part of who you are.' },
  { day: 45, name: 'Camp 3', icon: '⛰️', message: '45 days. The summit is in sight.' },
  { day: 60, name: 'Summit', icon: '🏔️', message: '60 days of showing up. This is who you are now.' },
];

export const MAX_STREAK_DAYS = 60;

// ═══════════════════════════════════════════════════════════════
// REFLECTION PROMPTS - For deepening intrinsic connection
// ═══════════════════════════════════════════════════════════════
export const REFLECTION_PROMPTS = [
  "How did that feel?",
  "What did you notice?",
  "Easier or harder than yesterday?",
  "What made today work?",
  "What would you tell yesterday's you?",
  "What's one thing you're grateful for right now?",
  "How does your body feel?",
  "What's different about today?",
];

export const shouldShowReflection = () => Math.random() < 0.2;

// ═══════════════════════════════════════════════════════════════
// OTHER CONSTANTS
// ═══════════════════════════════════════════════════════════════
export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to this' },
  { value: 'some', label: 'Some Experience', description: 'Tried before' },
  { value: 'intermediate', label: 'Intermediate', description: 'Solid foundation' },
  { value: 'advanced', label: 'Advanced', description: 'Looking to master' },
];

export const TIME_OPTIONS = [
  { value: 4, label: '4 weeks' },
  { value: 6, label: '6 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
];

export const COACH_SUGGESTIONS = [
  "I'm finding it hard to start today",
  "Help me understand my resistance",
  "What's my 2-minute version?",
  "I missed a day. What now?",
];

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS
// ═══════════════════════════════════════════════════════════════
// Default to bioluminescent dark theme
export const colors = bioluminescentColors;
