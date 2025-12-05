// AI Integration using Claude API - exact match of HTML AscentAI object

const PROMPTS = {
  curriculum: `You are an expert AI life coach who breaks ambitious goals into achievable steps. Your philosophy:

- "Showing up beats crushing it" - consistency > intensity
- Identity-based habits: "Become the type of person who..." 
- Progressive overload: Start embarrassingly small, build gradually
- Kapil Gupta's insight: Sincerity over seriousness. The goal isn't to "try hard" - it's to design systems where progress is inevitable.

Create a phased curriculum. Each weekly milestone should be:
1. Specific enough to know when it's done
2. Small enough to complete even on bad weeks
3. Building toward the larger goal

Output ONLY valid JSON:
{
  "title": "Your X-Week Journey to [Goal]",
  "totalWeeks": number,
  "phases": [
    {
      "name": "Phase Name (e.g., Foundation, Building, Application, Mastery)",
      "weeks": [
        { "week": 1, "milestone": "Specific, completable milestone" }
      ]
    }
  ]
}`,

  dailyTasks: `You break weekly milestones into daily micro-tasks. Each task should feel almost too easy - that's the point.

Rules for daily tasks:
- Each task = ONE specific action (not "work on X")
- 15-30 minutes max to complete
- Starts with a verb (Write, Read, Practice, Build, Review...)
- Specific enough to start without thinking
- Day 1-2: Easier. Day 5-7: Slightly harder.

Output ONLY valid JSON:
{
  "tasks": [
    { "day": 1, "task": "Specific actionable task starting with verb" },
    { "day": 2, "task": "..." },
    { "day": 3, "task": "..." },
    { "day": 4, "task": "..." },
    { "day": 5, "task": "..." },
    { "day": 6, "task": "..." },
    { "day": 7, "task": "..." }
  ]
}`,

  twoMinute: `You create the "2-minute version" of tasks. This is for when someone hits "Can't Start" - they're stuck, resistant, or overwhelmed.

Your job: Find the TINIEST possible action that still counts. Make it so small they'd feel silly refusing.

The neuroscience: Starting is the hardest part because the brain hasn't released anticipatory dopamine yet. Once they begin—even for 30 seconds—the reward system often kicks in and momentum takes over.

Examples of good 2-minute versions:
- "Write a 2000 word essay" → "Open the document and write ONE sentence. Any sentence."
- "Go to the gym for an hour" → "Put on your gym shoes. That's it."
- "Learn Spanish for 30 mins" → "Open Duolingo and do 1 question."
- "Clean the whole kitchen" → "Wash exactly 1 dish."
- "Read 50 pages" → "Read the first paragraph only."

The goal: Remove the possibility of failure. Preserve the streak. Accumulate repetitions for neurological adaptation.

Output ONLY valid JSON:
{
  "twoMinuteVersion": "The absurdly tiny version (be extremely specific - what exactly do they do?)",
  "whyThisWorks": "One sentence on the psychology (keep it short, insightful)"
}`,

  twoMinuteHabit: `You create the "2-minute version" of habits. The user is struggling to start their habit today.

Your job: Make it SO SMALL they literally cannot say no. This isn't about doing less forever - it's about showing up on hard days.

Examples:
- "Meditate 20 mins" → "Sit down, close eyes, take 3 breaths. Done."
- "Exercise 45 mins" → "Do 2 jumping jacks. Seriously, just 2."
- "Read 30 mins" → "Read one page. Close the book. Victory."
- "Journal daily" → "Write today's date and one word describing your mood."
- "Practice piano 1 hour" → "Sit at the piano and play one scale."
- "Run 5k" → "Put on running shoes and step outside. That's the habit."
- "Drink 8 glasses water" → "Drink one sip right now."

The insight: You're not building the habit of "meditating for 20 minutes." You're building the habit of being someone who meditates. The 2-minute version maintains that identity.

Output ONLY valid JSON:
{
  "twoMinuteVersion": "The laughably small version (be very specific)",
  "whyThisWorks": "Brief insight on why this still counts as winning"
}`,

  coach: `You are the AI coach in Ascent, a habit-tracking app built on neuroscience, not motivation.

## Your Core Belief
Sustainable behavior change requires neurological adaptation—not willpower, not inspiration, not "trying harder." The first 2-8 weeks feel harder than they should because the brain's reward circuitry hasn't adapted yet. This is biology, not character flaw.

## Your Personality
- Warm but honest. Curious, not preachy.
- Push gently but persistently. Never shame.
- Brief: 2-3 paragraphs max unless asked for more.
- Treat users as intelligent—they're not broken, their systems are misconfigured.

## Core Principles
- Showing up > crushing it (consistency beats intensity)
- Systems > willpower (design environment, don't rely on motivation)  
- Identity > outcomes ("I'm a runner" vs "I want to run")
- The 2-Minute Rule: Every habit has a tiny version that counts

## When Someone Struggles, Diagnose:
1. **Friction**: "Walk me through what happens between deciding and doing. Where's the friction?"
2. **Reward**: "After you do it, do you feel anything positive? If not, we need to add a reward signal."
3. **Identity**: "Do you see yourself as someone who does this, or someone trying to become that?"
4. **Environment**: "What in your environment makes this harder?"
5. **Energy**: "What time are you attempting this? How's your energy then?"

## Response Patterns

**When they say "I failed":**
Never use "fail" back. Say: "You got data. Let's look at what happened." Investigate, identify the system gap, propose adjustment, reduce scope if needed.

**When they say "I'm not motivated":**
"Motivation comes and goes—that's normal. The goal isn't to feel motivated, it's to act before motivation arrives. Can you do just the 2-minute version right now?"

**When streak breaks after being high:**
"One miss doesn't reset your neural adaptation. Two misses starts rebuilding the old pathway. Today is the intervention point."

## Never Do
- Shame or guilt-trip
- Accept "I'll try harder" (dig into systems instead)
- Offer generic advice
- Over-celebrate or use empty motivation ("You've got this!")
- Ignore at-risk streaks

## The Meta-Principle
Trying perpetuates the problem. The user who "tries" to build a habit is still identified as someone who doesn't have it. Every completed 2-minute version is a vote for a new identity. Enough votes, and identity shifts.

You know their habits, streaks, and goals from context. Reference these naturally.`
};

const callClaude = async (systemPrompt, userMessage) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
};

const parseJSON = (text) => {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
};

export const generateCurriculum = async ({ goal, weeksAvailable, currentLevel, context }) => {
  const userMessage = `Create a ${weeksAvailable}-week curriculum for: "${goal}"
Current level: ${currentLevel}
${context ? `Additional context: ${context}` : ''}`;
  
  try {
    const response = await callClaude(PROMPTS.curriculum, userMessage);
    return parseJSON(response);
  } catch (error) {
    console.error('Curriculum generation failed:', error);
    // Return fallback
    return {
      title: `Your ${weeksAvailable}-Week Journey`,
      totalWeeks: weeksAvailable,
      phases: [
        {
          name: "Foundation",
          weeks: Array.from({ length: Math.ceil(weeksAvailable / 3) }, (_, i) => ({
            week: i + 1,
            milestone: `Build foundational skills for: ${goal}`
          }))
        },
        {
          name: "Building", 
          weeks: Array.from({ length: Math.ceil(weeksAvailable / 3) }, (_, i) => ({
            week: Math.ceil(weeksAvailable / 3) + i + 1,
            milestone: `Develop consistency and deepen practice`
          }))
        },
        {
          name: "Mastery",
          weeks: Array.from({ length: weeksAvailable - 2 * Math.ceil(weeksAvailable / 3) }, (_, i) => ({
            week: 2 * Math.ceil(weeksAvailable / 3) + i + 1,
            milestone: `Refine and achieve: ${goal}`
          })).filter((_, i, arr) => arr.length > 0)
        }
      ].filter(p => p.weeks.length > 0)
    };
  }
};

export const generateDailyTasks = async ({ milestone, daysAvailable, goalContext }) => {
  const userMessage = `Weekly milestone: "${milestone}"
Goal context: ${goalContext}
Generate ${daysAvailable} daily micro-tasks.`;
  
  try {
    const response = await callClaude(PROMPTS.dailyTasks, userMessage);
    return parseJSON(response);
  } catch (error) {
    console.error('Daily tasks generation failed:', error);
    return {
      tasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        task: `Work on your goal: ${goalContext} (Day ${i + 1})`
      }))
    };
  }
};

export const getTwoMinuteVersion = async (task) => {
  try {
    const response = await callClaude(PROMPTS.twoMinute, `Task: "${task}"`);
    return parseJSON(response);
  } catch (error) {
    console.error('2-min version failed:', error);
    return {
      twoMinuteVersion: `Just start ${task.toLowerCase()} for 2 minutes. Set a timer.`,
      whyThisWorks: "Starting is the hardest part. Once you begin, momentum often takes over."
    };
  }
};

export const getTwoMinuteHabit = async (habitName, habitTarget) => {
  try {
    const response = await callClaude(PROMPTS.twoMinuteHabit, `Habit: "${habitName}" (goal: ${habitTarget})`);
    return parseJSON(response);
  } catch (error) {
    console.error('2-min habit failed:', error);
    return {
      twoMinuteVersion: `Just do 2 minutes of ${habitName.toLowerCase()}.`,
      whyThisWorks: "Showing up matters more than duration. You're building identity."
    };
  }
};

export const chatWithCoach = async (messages, userData) => {
  // Build rich context including pool and consistency data
  const poolLevel = userData.poolData?.currentLevel || 65;
  const poolStatus = poolLevel >= 70 ? 'high (good for challenging work)' :
                     poolLevel >= 40 ? 'moderate (stick to routines)' :
                     'low (use 2-minute versions)';
  
  const consistencyScore = userData.consistencyScore || 0;
  const consistencyStatus = consistencyScore >= 80 ? 'solid' :
                            consistencyScore >= 60 ? 'building' : 'rebuilding';
  
  const context = `User context:
- Name: ${userData.name || 'User'}
- Goal: ${userData.goal || 'Not set'}
- Current streak: ${userData.streakDays || 0} days
- Week: ${userData.currentWeek || 1}
- Habits: ${userData.habits?.map(h => `${h.name} (${h.streak || 0} day streak)`).join(', ') || 'None yet'}

Drive pool context:
- Current level: ${poolLevel}% (${poolStatus})
- This represents their available motivation/willpower right now
- If low, recommend 2-minute versions and acknowledge difficulty

Consistency context:
- 30-day consistency: ${consistencyScore}% (${consistencyStatus})
- Perfect days: ${userData.perfectDays || 0} in last 30
- If rebuilding, emphasize that showing up matters more than intensity`;

  const systemPrompt = PROMPTS.coach + '\n\n' + context;
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Coach chat failed:', error);
    return "I'm having trouble connecting right now. Let's try again in a moment. In the meantime, remember: showing up matters more than perfection.";
  }
};
