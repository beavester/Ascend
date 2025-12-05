# Ascent - React Native

A habit-tracking app built on neuroscience, not motivation. This is an **exact** React Native conversion of the Ascent v15 HTML app.

## Features (100% Match with HTML)

- **Onboarding Flow**: 8-slide educational onboarding about dopamine, habits, and the science of behavior change
- **AI-Powered Curriculum**: Claude generates personalized weekly milestones and daily micro-tasks
- **2-Minute Rule**: AI generates tiny versions of tasks/habits when you're struggling to start
- **Mountain Visualization**: Track your 60-day journey to habit autopilot with SVG visualization
- **Daily Ring**: Activity ring shows daily completion progress (Apple Watch style)
- **Heatmap**: GitHub-style activity heatmap for the last 35 days
- **AI Coach**: Chat with Claude for personalized habit coaching
- **Streak Tracking**: Per-habit and overall streak tracking
- **Milestone System**: Unlock camps as you progress (Base Camp → Camp 1 → Camp 2 → Camp 3 → Summit)
- **Celebration Overlay**: Green "Done!" celebration on task/habit completion
- **Profile Tab**: View badges earned, streak count, and reset data
- **Weekly Plan View**: See all 7 daily tasks for current week
- **60 Days Info Modal**: Scientific explanation of habit formation timeline

## Project Structure

```
ascent-react-native/
├── App.js                          # Main entry point & screen orchestration
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── assets/                         # App icons and splash
└── src/
    ├── constants/
    │   └── theme.js               # Colors, spacing, quotes, milestones (exact CSS variable match)
    ├── services/
    │   ├── storage.js             # AsyncStorage persistence + streak calculations
    │   └── ai.js                  # Claude API integration (all prompts)
    ├── screens/
    │   ├── SplashScreen.js        # App splash with Sisyphus/boulder logo SVG
    │   ├── OnboardingScreen.js    # 8-slide educational onboarding
    │   ├── SetupScreen.js         # Goal setup wizard (4 steps + generating)
    │   └── MainScreen.js          # Main app with 4 tabs + modals + celebration
    └── components/
        ├── Mountain.js            # SVG mountain progress visualization
        ├── DailyRing.js           # Activity ring component
        ├── Heatmap.js             # GitHub-style heatmap
        ├── Cards.js               # TaskCard, HabitCard, QuoteCard
        └── index.js               # Component exports
```

## Tabs (4 Total)

1. **Today** - Quote, Mountain, Ring, Today's Task, Habits, Heatmap
2. **Coach** - AI chat interface with suggestions
3. **Plan** - Curriculum overview with phases/weeks
4. **You** - Profile, badges, streak, reset button

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your device:
   - Scan the QR code with Expo Go (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Dependencies

- **expo**: ~52.0.0
- **react-native-svg**: SVG rendering for mountain, ring, logo
- **expo-linear-gradient**: Gradient backgrounds (splash, onboarding)
- **@react-native-async-storage/async-storage**: Data persistence
- **react-native-safe-area-context**: Safe area handling
- **@expo/vector-icons**: Ionicons throughout

## AI Integration

The app uses Claude (claude-sonnet-4-20250514) for:
- `generateCurriculum()` - Personalized multi-phase curriculum
- `generateDailyTasks()` - 7 daily micro-tasks per week
- `getTwoMinuteVersion()` - Tiny version of any task
- `getTwoMinuteHabit()` - Tiny version of any habit
- `chatWithCoach()` - Full coaching conversation

API calls go to `https://api.anthropic.com/v1/messages` with system prompts matching the HTML exactly.

## Data Model (Matches HTML localStorage)

```javascript
{
  name: '',
  goal: '',
  goalContext: '',
  weeksAvailable: 8,
  currentLevel: 'beginner',
  onboardingComplete: false,
  startDate: null,
  habits: [],           // { id, name, amount, unit }
  completions: [],      // { odHabitId, date, completed }
  curriculum: null,     // AI-generated
  dailyTasks: [],       // { day, task }
  taskCompletions: [],  // "week1-day3" format strings
  currentWeek: 1,
  streakDays: 0,
  unlockedMilestones: [],
  chatMessages: []
}
```

## Modals & Overlays

- **Add Habit Modal** - Name, amount, unit selector
- **60 Days Info Modal** - Lally et al. research explanation
- **Milestone Modal** - Badge earned celebration
- **Celebration Overlay** - Full-screen green "Done!" on completion
- **Weekly Plan Screen** - Full-screen view of all 7 daily tasks

## Exact HTML Matching

| HTML Element | React Native Match |
|--------------|-------------------|
| CSS variables | `theme.js` constants |
| Mountain SVG path points | Identical coordinates |
| Milestone days (7,14,30,45,60) | Same |
| All AI system prompts | Verbatim copy |
| Streak calculation logic | Same algorithm |
| Heatmap algorithm | Same algorithm |
| 2-minute rule implementation | Same |
| Celebration timing (1.5s) | Same |
| Tab icons & labels | Same (Today, Coach, Plan, You) |
