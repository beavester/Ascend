// Invisible Ratchet Algorithm
// Per spec: "Your new floor" - silently raises minimum without user awareness
// No gamification, no points - just natural habit strengthening

import { getTodayStr } from './storage';

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// RATCHET CALCULATIONS
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

/**
 * Calculate consistency percentage for a habit over a window
 * @param {Array} completions - All completion records
 * @param {string} habitId - The habit to check
 * @param {number} days - Window size (default 14)
 * @returns {number} Percentage 0-100
 */
export const calculateHabitConsistency = (completions, habitId, days = 14) => {
  const today = new Date();
  let completedDays = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toDateString();

    const done = completions.some(
      c => c.odHabitId === habitId &&
        new Date(c.date).toDateString() === dateStr &&
        c.completed
    );

    if (done) completedDays++;
  }

  return Math.round((completedDays / days) * 100);
};

/**
 * Determine if a habit's floor should be raised
 * The ratchet only goes up, never down
 * @param {Object} ratchetData - Current ratchet state
 * @param {string} habitId - Habit to check
 * @param {Array} completions - Completion records
 * @returns {Object} { shouldRaise, newFloor, currentFloor, consistency }
 */
export const shouldRaiseFloor = (ratchetData, habitId, completions) => {
  const currentFloor = ratchetData.habitFloors?.[habitId]?.floor || 0;
  const lastRaised = ratchetData.habitFloors?.[habitId]?.lastRaised;
  const consistencyWindow = ratchetData.consistencyWindow || 14;

  // Calculate current consistency
  const consistency = calculateHabitConsistency(completions, habitId, consistencyWindow);

  // Don't raise if we raised within the last 7 days
  if (lastRaised) {
    const daysSinceRaise = Math.floor(
      (new Date() - new Date(lastRaised)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceRaise < 7) {
      return { shouldRaise: false, newFloor: currentFloor, currentFloor, consistency };
    }
  }

  // Ratchet logic: If consistency exceeds floor by significant margin, raise it
  // But never raise above 85% - leave room for humanity
  const threshold = currentFloor + 15; // Need 15% above current floor
  const maxFloor = 85;

  if (consistency >= threshold && consistency > currentFloor) {
    const newFloor = Math.min(
      Math.floor(consistency * 0.9), // Set new floor at 90% of current consistency
      maxFloor
    );

    if (newFloor > currentFloor) {
      return { shouldRaise: true, newFloor, currentFloor, consistency };
    }
  }

  return { shouldRaise: false, newFloor: currentFloor, currentFloor, consistency };
};

/**
 * Apply the ratchet raise for a habit
 * @param {Object} ratchetData - Current ratchet state
 * @param {string} habitId - Habit to update
 * @param {number} newFloor - New floor value
 * @returns {Object} Updated ratchet data
 */
export const applyRatchetRaise = (ratchetData, habitId, newFloor) => {
  const today = new Date().toISOString().split('T')[0];

  return {
    ...ratchetData,
    habitFloors: {
      ...ratchetData.habitFloors,
      [habitId]: {
        floor: newFloor,
        lastRaised: today,
        history: [
          ...(ratchetData.habitFloors?.[habitId]?.history || []),
          { date: today, floor: newFloor }
        ].slice(-10) // Keep last 10 raises
      }
    }
  };
};

/**
 * Check all habits and return any that should be raised
 * @param {Object} ratchetData - Current ratchet state
 * @param {Array} habits - All habits
 * @param {Array} completions - All completions
 * @returns {Array} Array of { habitId, newFloor, currentFloor, consistency }
 */
export const checkAllHabitsForRatchet = (ratchetData, habits, completions) => {
  const raises = [];

  for (const habit of habits) {
    const result = shouldRaiseFloor(ratchetData, habit.id, completions);
    if (result.shouldRaise) {
      raises.push({
        habitId: habit.id,
        habitName: habit.name,
        ...result
      });
    }
  }

  return raises;
};

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// FLOOR STATUS HELPERS
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

/**
 * Get status based on consistency vs floor
 * @param {number} consistency - Current consistency percentage
 * @param {number} floor - Current floor
 * @returns {Object} { status, message }
 */
export const getFloorStatus = (consistency, floor) => {
  const diff = consistency - floor;

  if (floor === 0) {
    return {
      status: 'building',
      message: 'Building your foundation',
      color: 'text2'
    };
  }

  if (diff >= 15) {
    return {
      status: 'exceeding',
      message: 'Exceeding your baseline',
      color: 'success'
    };
  }

  if (diff >= 5) {
    return {
      status: 'solid',
      message: 'Solid consistency',
      color: 'poolFull'
    };
  }

  if (diff >= -5) {
    return {
      status: 'maintaining',
      message: 'Maintaining your floor',
      color: 'text'
    };
  }

  if (diff >= -15) {
    return {
      status: 'slipping',
      message: 'Slipping below baseline',
      color: 'warning'
    };
  }

  return {
    status: 'rebuilding',
    message: 'Rebuilding momentum',
    color: 'danger'
  };
};

/**
 * Get the suggested "2-minute version" based on floor status
 * Lower consistency = suggest easier versions more
 */
export const shouldSuggestTwoMinute = (consistency, floor, poolLevel) => {
  // Always suggest if pool is low
  if (poolLevel < 40) return true;

  // If below floor, suggest 2-min version
  if (consistency < floor) return true;

  // If struggling (under 50% consistency), suggest 2-min
  if (consistency < 50) return true;

  return false;
};

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// INSIGHT GENERATION
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

/**
 * Generate insight about habit floor
 * Used by coach and insights system
 */
export const generateRatchetInsight = (habitName, consistency, floor, recentRaise) => {
  if (recentRaise) {
    return {
      type: 'floor_raised',
      message: `Your ${habitName} floor just rose to ${floor}%. This is your new baseline - you've proven you can maintain this level.`,
      tone: 'acknowledgment' // Not celebration, just quiet recognition
    };
  }

  const status = getFloorStatus(consistency, floor);

  switch (status.status) {
    case 'exceeding':
      return {
        type: 'exceeding_floor',
        message: `${habitName} is at ${consistency}% - well above your ${floor}% floor. The ratchet may rise soon.`,
        tone: 'informational'
      };

    case 'slipping':
      return {
        type: 'below_floor',
        message: `${habitName} has dipped to ${consistency}%, below your ${floor}% floor. Consider the 2-minute version to rebuild.`,
        tone: 'supportive'
      };

    case 'rebuilding':
      return {
        type: 'rebuilding',
        message: `${habitName} needs attention (${consistency}% vs ${floor}% floor). Small consistent actions will raise it back.`,
        tone: 'coaching'
      };

    default:
      return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY FUNCTIONS (used by MainScreen)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if ratchet should go up (legacy name for MainScreen compatibility)
 * @param {Object} data - Full app data
 * @returns {Object|null} Ratchet suggestion if applicable
 */
export const checkRatchetUp = (data) => {
  const { habits, completions, ratchetData } = data;
  if (!habits?.length || !ratchetData) return null;

  const raises = checkAllHabitsForRatchet(
    ratchetData || { habitFloors: {}, consistencyWindow: 14 },
    habits,
    completions || []
  );

  if (raises.length > 0) {
    const raise = raises[0]; // Handle one at a time
    return {
      type: 'up',
      habitId: raise.habitId,
      habitName: raise.habitName,
      currentFloor: raise.currentFloor,
      newFloor: raise.newFloor,
      consistency: raise.consistency,
      message: `Your ${raise.habitName} consistency has been solid. Your new baseline is ${raise.newFloor}%.`
    };
  }

  return null;
};

/**
 * Check if habit is slipping below floor (for proactive coaching)
 * @param {Object} data - Full app data
 * @returns {Object|null} Ratchet down warning if applicable
 */
export const checkRatchetDown = (data) => {
  const { habits, completions, ratchetData } = data;
  if (!habits?.length || !ratchetData?.habitFloors) return null;

  for (const habit of habits) {
    const floor = ratchetData.habitFloors[habit.id]?.floor || 0;
    if (floor === 0) continue; // No floor established yet

    const consistency = calculateHabitConsistency(completions || [], habit.id, 14);
    const diff = consistency - floor;

    // If significantly below floor, return warning
    if (diff < -10) {
      return {
        type: 'down',
        habitId: habit.id,
        habitName: habit.name,
        currentFloor: floor,
        consistency,
        message: `${habit.name} has dropped to ${consistency}% (floor: ${floor}%). The 2-minute version keeps the habit alive.`
      };
    }
  }

  return null;
};

/**
 * Apply ratchet change to data (legacy name for MainScreen)
 * @param {Object} data - Full app data
 * @param {Object} ratchet - Ratchet suggestion from checkRatchetUp
 * @returns {Object} Updated data
 */
export const applyRatchet = (data, ratchet) => {
  if (!ratchet || ratchet.type !== 'up') return data;

  const updatedRatchetData = applyRatchetRaise(
    data.ratchetData || { habitFloors: {}, consistencyWindow: 14 },
    ratchet.habitId,
    ratchet.newFloor
  );

  return {
    ...data,
    ratchetData: updatedRatchetData
  };
};

export default {
  calculateHabitConsistency,
  shouldRaiseFloor,
  applyRatchetRaise,
  checkAllHabitsForRatchet,
  getFloorStatus,
  shouldSuggestTwoMinute,
  generateRatchetInsight,
  checkRatchetUp,
  checkRatchetDown,
  applyRatchet,
};
