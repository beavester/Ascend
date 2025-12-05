// Exact match of HTML CSS variables
export const colors = {
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
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  
  // Gamification colors
  ringEmpty: '#e2e8f0',
  ringProgress: '#3b82f6',
  ringComplete: '#22c55e',
  ringGlow: 'rgba(34, 197, 94, 0.4)',
  flameCore: '#f59e0b',
  flameOuter: '#ef4444',
  heatmap0: '#e2e8f0',
  heatmap25: '#dcfce7',
  heatmap50: '#86efac',
  heatmap75: '#22c55e',
  heatmap100: '#16a34a',
  mountainRock: '#64748b',
  mountainSnow: '#f1f5f9',
  mountainPath: '#f59e0b',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
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

export const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
];

export const MILESTONES = [
  { day: 7, name: 'Base Camp', icon: '⛺', message: 'First week complete! The foundation is set.' },
  { day: 14, name: 'Camp 1', icon: '🏕️', message: 'Two weeks strong! Your neural pathways are forming.' },
  { day: 30, name: 'Camp 2', icon: '🚩', message: 'One month! You\'re building real momentum.' },
  { day: 45, name: 'Camp 3', icon: '⛰️', message: '45 days! The summit is in sight.' },
  { day: 60, name: 'Summit', icon: '🏔️', message: 'You made it! 60 days of showing up.' },
];

export const MAX_STREAK_DAYS = 60;

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

export const UNIT_OPTIONS = ['minutes', 'times', 'pages', 'reps', 'glasses', 'words', 'miles', 'hours'];

export const COACH_SUGGESTIONS = [
  "I'm struggling with motivation today",
  "Help me build a new habit",
  "I broke my streak, what now?",
  "How do I stay consistent?",
];
