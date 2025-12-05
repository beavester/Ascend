# Ascent v2.0 — Complete Implementation Guide

## Architecture Overview

```
ascent/
├── src/
│   ├── screens/
│   │   ├── MainScreen.js          # Core app with tabs
│   │   ├── SettingsScreen.js      # Full settings panel
│   │   ├── OnboardingScreen.js    # Initial setup
│   │   └── SetupScreen.js         # Goal configuration
│   │
│   ├── components/
│   │   ├── DopamineVessel.js      # Pool visualization
│   │   ├── PoolHistory.js         # Trends & cross-titration
│   │   ├── PoolOnboarding.js      # Pool education
│   │   ├── RewardToast.js         # Variable rewards
│   │   ├── MissRecoveryModal.js   # Return-after-miss
│   │   ├── RatchetModal.js        # Target escalation
│   │   ├── LogActivityModal.js    # Manual activity logging
│   │   ├── Cards.js               # Habit & Task cards
│   │   └── [core components...]
│   │
│   ├── services/
│   │   ├── dopaminePool.js        # Pool mechanics
│   │   ├── rewards.js             # Variable reward system
│   │   ├── insightEngine.js       # Pattern detection
│   │   ├── streakCalculator.js    # Resilient streaks
│   │   ├── ratchet.js             # Auto-escalation
│   │   ├── screenTime.js          # iOS Screen Time
│   │   ├── ai.js                  # Claude integration
│   │   └── storage.js             # AsyncStorage
│   │
│   ├── hooks/
│   │   ├── useTheme.js            # Dark mode
│   │   ├── useHaptics.js          # Vibration patterns
│   │   └── useAppData.js          # Data management
│   │
│   └── constants/
│       ├── theme.js               # Colors, spacing
│       └── milestones.js          # Achievement definitions
```

---

## Feature Integration Map

### 1. Dopamine Pool System

**Entry Points:**
- `MainScreen.js` → Shows `DopamineVessel` at top of Today tab
- `SettingsScreen.js` → Pool toggle, app mappings, Friday mode
- `LogActivityModal.js` → Manual recharge/drain logging

**Data Flow:**
```
Morning calculation (dopaminePool.js)
    ↓
calculateMorningPool({ yesterdayComplete, streakDays, lastSleepHours })
    ↓
poolData.morningLevel stored in AsyncStorage
    ↓
Throughout day: drains/recharges update currentLevel
    ↓
DopamineVessel renders current state
    ↓
Status colors/messages update HabitCard hints
```

**Integration Points:**
```javascript
// In MainScreen.js initialization
useEffect(() => {
  const today = new Date().toISOString().split('T')[0];
  const lastUpdate = data.poolData?.lastUpdated?.split('T')[0];
  
  if (lastUpdate !== today) {
    // New day - recalculate morning pool
    const morningLevel = calculateMorningPool({...});
    // Update state and storage
  }
}, []);
```

### 2. Variable Reward System

**Entry Points:**
- `MainScreen.js` → `toggleHabit()` and `toggleTask()`
- `RewardToast.js` → Display component

**Integration:**
```javascript
// In toggleHabit handler
if (shouldShowReward({ completionsToday, totalCompletions })) {
  const reward = getCompletionReward({
    habitName,
    streak,
    recentRewards: data.recentRewards,
  });
  setRewardContext(reward);
  setShowRewardToast(true);
}
```

**Reward Distribution:**
- 55% acknowledgment
- 20% identity reinforcement
- 15% pattern insight
- 7% neuroscience
- 3% rare delight

### 3. Resilient Streak System

**Entry Points:**
- `streakCalculator.js` → Core calculation
- `MainScreen.js` → Trends tab consistency card
- `Cards.js` → HabitCard streak badges

**Integration:**
```javascript
// Calculate for individual habit
const habitStreak = calculateResilientStreak(completions, habitId);
// Returns: { consistencyScore, currentRun, bestRun, status, color, message }

// Calculate overall
const overallStreakData = calculateOverallResilientStreak(habits, completions);
```

**Status Mapping:**
- ≥80% → Solid (green): "This is becoming who you are"
- 60-79% → Amber (orange): "Some wobble, still in the game"
- <60% → Rebuilding (gray): "Every rep counts"

### 4. Proactive Insight Engine

**Entry Points:**
- `insightEngine.js` → Pattern detection
- `MainScreen.js` → On mount, checks for insights
- `RewardToast.js` → `InsightBanner` component

**Trigger System:**
```javascript
// On app open
const insight = checkForInsights(data, data.lastShownInsights);
if (insight) {
  setProactiveInsight(insight);
}

// Insight types: morning_advantage, friday_friction, streak_threshold,
// streak_at_risk, habit_too_hard, two_min_underused, pool_correlation,
// return_after_miss
```

### 5. Invisible Ratchet

**Entry Points:**
- `ratchet.js` → Algorithm
- `RatchetModal.js` → UI components
- `SettingsScreen.js` → Toggle on/off

**Integration:**
```javascript
// Check periodically (e.g., weekly)
import { checkRatchetUp, checkRatchetDown, applyRatchet } from './services/ratchet';

const ratchetSuggestion = checkRatchetUp(habit, completions, ratchetHistory);
if (ratchetSuggestion) {
  // Show RatchetUpModal
}

// If user accepts
const updatedHistory = applyRatchet(habit, newTarget, ratchetHistory);
const updatedHabit = { ...habit, amount: newTarget };
```

### 6. Cross-Titration Tracking

**Entry Points:**
- `ratchet.js` → `calculateCrossTitration()`
- `PoolHistory.js` → `CrossTitrationChart` component
- `screenTime.js` → iOS Screen Time bridge

**Data Flow:**
```
Screen Time API (or manual entry)
    ↓
recordScreenTime(data, date, history)
    ↓
Stored in screenTimeHistory
    ↓
calculateCrossTitration(screenTimeHistory, completions, habits)
    ↓
CrossTitrationChart renders weekly trends
    ↓
Insight generated if pattern detected
```

### 7. Pool Onboarding

**Entry Points:**
- `PoolOnboarding.js` → Full modal flow
- `QuickPoolTip` → Contextual tips
- `SettingsScreen.js` → `hasSeenPoolIntro` flag

**Integration:**
```javascript
// On first pool view
if (!data.hasSeenPoolIntro) {
  setShowPoolOnboarding(true);
}

// On complete
onComplete={() => {
  setShowPoolOnboarding(false);
  setData(prev => ({ ...prev, hasSeenPoolIntro: true }));
  saveData({ ...data, hasSeenPoolIntro: true });
}}
```

---

## Settings Schema

```javascript
settings: {
  // Pool
  showDopaminePool: true,
  showPoolBreakdown: true,
  fridayEasyMode: false,
  
  // Habits
  resilientStreaks: true,
  variableRewards: true,
  autoTwoMinPrompt: true,
  invisibleRatchet: false,
  
  // Insights
  proactiveInsights: true,
  streakAtRiskAlert: true,
  missRecoveryMessages: true,
  
  // Appearance
  hapticsEnabled: true,
  minimalAnimations: false,
}
```

---

## Data Migrations

When updating from v1.x to v2.0:

```javascript
const migrateData = (oldData) => {
  return {
    ...oldData,
    
    // Add new pool structure
    poolData: oldData.poolData || {
      currentLevel: 65,
      morningLevel: 65,
      lastUpdated: null,
      drainActivities: [],
      rechargeActivities: [],
      customAppMappings: {},
    },
    poolHistory: oldData.poolHistory || [],
    
    // Add insight tracking
    lastShownInsights: oldData.lastShownInsights || {},
    
    // Add reward tracking
    recentRewards: oldData.recentRewards || [],
    completionsToday: oldData.completionsToday || 0,
    
    // Add ratchet history
    ratchetHistory: oldData.ratchetHistory || {},
    
    // Add screen time
    screenTimeHistory: oldData.screenTimeHistory || [],
    
    // Add settings
    settings: {
      showDopaminePool: true,
      ...oldData.settings,
    },
    
    // Add flags
    hasSeenPoolIntro: oldData.hasSeenPoolIntro || false,
    hasSeenMissRecovery: oldData.hasSeenMissRecovery || false,
  };
};
```

---

## Performance Considerations

### Heavy Operations

1. **Resilient Streak Calculation**
   - Involves 30-day window scan
   - Memoize in component with useMemo
   - Recalculate only on completion changes

2. **Insight Engine**
   - Multiple pattern checks
   - Run on mount, not every render
   - Cache results in state

3. **Pool History Charts**
   - SVG rendering can be heavy
   - Use React.memo for chart components
   - Limit data points displayed

### Recommended Patterns

```javascript
// Memoize expensive calculations
const overallStreakData = useMemo(
  () => calculateOverallResilientStreak(data.habits, data.completions),
  [data.habits, data.completions]
);

// Lazy load heavy components
const PoolHistoryChart = React.lazy(() => import('./PoolHistory'));

// Throttle pool updates
const throttledPoolUpdate = useCallback(
  throttle((newLevel) => {
    setPoolLevel(newLevel);
    // Save to storage
  }, 1000),
  []
);
```

---

## Testing Checklist

### Pool System
- [ ] Morning pool calculates correctly
- [ ] Drain activities decrease level
- [ ] Recharge activities increase level
- [ ] Colors change at thresholds (70%, 40%)
- [ ] Status messages match level
- [ ] Low pool hints show on habit cards

### Variable Rewards
- [ ] Rewards show on completion
- [ ] Distribution matches weights
- [ ] No duplicate recent rewards
- [ ] Haptics vary appropriately

### Resilient Streaks
- [ ] Consistency score calculates correctly
- [ ] Status transitions at thresholds
- [ ] Colors match status
- [ ] Messages are appropriate

### Insights
- [ ] Patterns detected correctly
- [ ] No duplicate insights within 3 days
- [ ] Dismissal works
- [ ] Actions navigate properly

### Ratchet
- [ ] Suggestions appear at right time
- [ ] Accept updates habit target
- [ ] Decline respects preference
- [ ] Cooldown period works

### Cross-Titration
- [ ] Chart renders with data
- [ ] Trends calculated correctly
- [ ] Insights trigger appropriately

---

## Future Roadmap

### Phase 1: Core Polish
- [ ] Add animations to pool level changes
- [ ] Implement pool widget
- [ ] Add Siri shortcuts for logging

### Phase 2: Deep Integration
- [ ] iOS Screen Time API full integration
- [ ] HealthKit for recharge activities
- [ ] Apple Watch companion

### Phase 3: Social Layer
- [ ] Accountability partners
- [ ] Anonymous consistency leaderboards
- [ ] Streak protection from friends

### Phase 4: ML Enhancement
- [ ] Personalized drain rate learning
- [ ] Optimal timing predictions
- [ ] Habit pairing suggestions

---

## Appendix: Key Algorithms

### Morning Pool Calculation
```javascript
function calculateMorningPool({ yesterdayComplete, streakDays, lastSleepHours }) {
  let pool = 65; // baseline
  
  // Previous day bonus
  if (yesterdayComplete) pool += 10;
  
  // Streak momentum
  if (streakDays >= 7) pool += 5;
  if (streakDays >= 21) pool += 5;
  if (streakDays >= 60) pool += 5;
  
  // Sleep factor
  if (lastSleepHours >= 7) pool += 5;
  if (lastSleepHours >= 8) pool += 5;
  if (lastSleepHours < 6) pool -= 10;
  
  return Math.min(100, Math.max(0, pool));
}
```

### Resilient Streak Score
```javascript
function calculateConsistencyScore(completions, habitId, windowDays = 30) {
  const today = new Date();
  let completed = 0;
  
  for (let d = 0; d < windowDays; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    
    if (completions.some(c => 
      c.odHabitId === habitId && 
      c.date.startsWith(dateStr) && 
      c.completed
    )) {
      completed++;
    }
  }
  
  return Math.round((completed / windowDays) * 100);
}
```

### Cross-Titration Correlation
```javascript
function calculateCorrelation(drainData, completionData) {
  // Pearson correlation between drain app usage and habit completion
  // Negative correlation = good (less drain → more habits)
  // Score: ((-r + 1) / 2) * 100
  // -1 correlation → 100 score
  //  0 correlation → 50 score
  // +1 correlation → 0 score
}
```

---

*Ascent v2.0 — Behavioral pharmacokinetics for habit formation*
