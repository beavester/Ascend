// Theme system with dark mode support
// Identity-based design: no gamification, just quiet satisfaction

// ═══════════════════════════════════════════════════════════════
// LIGHT THEME
// ═══════════════════════════════════════════════════════════════
export const lightColors = {
  bg: '#f8fafc',
  bg2: '#f1f5f9',
  bg3: '#e2e8f0',
  card: '#ffffff',
  text: '#0f172a',
  text2: '#475569',
  text3: '#94a3b8',
  accent: '#3b82f6',
  accentLight: '#dbeafe',
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  
  // Ring colors
  ringEmpty: '#e2e8f0',
  ringProgress: '#3b82f6',
  ringComplete: '#22c55e',
  
  // Heatmap colors
  heatmap0: '#e2e8f0',
  heatmap25: '#dcfce7',
  heatmap50: '#86efac',
  heatmap75: '#22c55e',
  heatmap100: '#16a34a',
  
  // Mountain colors
  mountainRock: '#64748b',
  mountainSnow: '#f1f5f9',
  mountainPath: '#f59e0b',
  mountainSky1: '#dbeafe',
  mountainSky2: '#eff6ff',
};

// ═══════════════════════════════════════════════════════════════
// DARK THEME
// ═══════════════════════════════════════════════════════════════
export const darkColors = {
  bg: '#0f172a',
  bg2: '#1e293b',
  bg3: '#334155',
  card: '#1e293b',
  text: '#f8fafc',
  text2: '#cbd5e1',
  text3: '#64748b',
  accent: '#60a5fa',
  accentLight: '#1e3a5f',
  success: '#4ade80',
  successLight: '#14532d',
  warning: '#fbbf24',
  warningLight: '#422006',
  danger: '#f87171',
  dangerLight: '#450a0a',
  purple: '#a78bfa',
  purpleLight: '#2e1065',
  
  // Ring colors
  ringEmpty: '#334155',
  ringProgress: '#60a5fa',
  ringComplete: '#4ade80',
  
  // Heatmap colors
  heatmap0: '#334155',
  heatmap25: '#14532d',
  heatmap50: '#166534',
  heatmap75: '#22c55e',
  heatmap100: '#4ade80',
  
  // Mountain colors
  mountainRock: '#475569',
  mountainSnow: '#cbd5e1',
  mountainPath: '#fbbf24',
  mountainSky1: '#1e293b',
  mountainSky2: '#0f172a',
};

// ═══════════════════════════════════════════════════════════════
// STREAK COLORS - Based on depth forming, not achievement
// ═══════════════════════════════════════════════════════════════
export const getStreakColor = (days, isDark = false) => {
  if (days < 7) return isDark ? '#64748b' : '#94a3b8';   // Neutral - just starting
  if (days < 14) return '#f59e0b';                        // Warm - taking root
  if (days < 30) return '#ea580c';                        // Warmer - deepening
  return '#c2410c';                                       // Deep amber - part of you
};

// ═══════════════════════════════════════════════════════════════
// SHARED VALUES
// ═══════════════════════════════════════════════════════════════
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,    // Increased from 12 for breathing room
  lg: 24,    // Increased from 16
  xl: 32,    // Increased from 20
  xxl: 48,   // Increased from 24
  
  // Semantic spacing
  section: 40,       // Between major sections
  card: 16,          // Inside cards  
  screenPadding: 20, // Edge padding
  listGap: 12,       // Between list items
};

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
};

// Dark mode shadows are more subtle
export const darkShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
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

// Show reflection prompt ~20% of the time
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

// Legacy export for compatibility
export const colors = lightColors;
