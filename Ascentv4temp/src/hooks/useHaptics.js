// Centralized Haptic Patterns
// Variable celebration intensities for engagement

import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════
// HAPTIC PATTERNS
// ═══════════════════════════════════════════════════════════════

const patterns = {
  // ─────────────────────────────────────────────────────────────
  // POSITIVE ACTIONS
  // ─────────────────────────────────────────────────────────────
  
  // Standard completion - light feedback
  complete: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // Successful action
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  
  // Variable celebration - creates anticipation
  celebration: () => {
    const intensity = Math.random();
    
    if (intensity > 0.9) {
      // 10% chance: Triple pulse - memorable!
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    } else if (intensity > 0.7) {
      // 20% chance: Double pulse
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
    } else {
      // 70% chance: Single light
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  // Day complete - special moment
  dayComplete: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
  },
  
  // Milestone reached
  milestone: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    }, 300);
  },
  
  // ─────────────────────────────────────────────────────────────
  // NAVIGATION & SELECTION
  // ─────────────────────────────────────────────────────────────
  
  // Selection change (tabs, toggles)
  select: () => {
    Haptics.selectionAsync();
  },
  
  // Button tap
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // Modal open
  modalOpen: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // ─────────────────────────────────────────────────────────────
  // WARNINGS & NEGATIVE
  // ─────────────────────────────────────────────────────────────
  
  // Warning (streak at risk, etc)
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  
  // Error
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  
  // Delete confirmation
  deleteConfirm: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  
  // ─────────────────────────────────────────────────────────────
  // POOL-RELATED
  // ─────────────────────────────────────────────────────────────
  
  // Pool draining (subtle)
  poolDrain: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // Pool recharging (positive)
  poolRecharge: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
};

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export const useHaptics = () => patterns;

// Direct export for non-hook usage
export default patterns;
