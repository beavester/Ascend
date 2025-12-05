// Ratchet Modal Component
// Shows when habits are ready for target escalation (invisible ratchet)

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { radius } from '../constants/theme';

// ═══════════════════════════════════════════════════════════════
// RATCHET UP MODAL
// Shows when consistency is high enough to increase target
// ═══════════════════════════════════════════════════════════════

export const RatchetUpModal = ({
  visible,
  ratchetData,
  onAccept,
  onDecline,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  
  if (!ratchetData) return null;
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.successLight }]}>
            <Ionicons name="trending-up" size={32} color={colors.success} />
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Ready to Level Up
          </Text>
          
          {/* Habit info */}
          <View style={[styles.habitCard, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.habitName, { color: colors.text }]}>
              {ratchetData.habitName}
            </Text>
            <View style={styles.targetChange}>
              <Text style={[styles.oldTarget, { color: colors.text3 }]}>
                {ratchetData.currentTarget}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accent} />
              <Text style={[styles.newTarget, { color: colors.success }]}>
                {ratchetData.newTarget}
              </Text>
            </View>
          </View>
          
          {/* Consistency badge */}
          <View style={[styles.consistencyBadge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.consistencyText, { color: colors.success }]}>
              {ratchetData.consistency}% consistency over 14 days
            </Text>
          </View>
          
          {/* Message */}
          <Text style={[styles.message, { color: colors.text2 }]}>
            You've proven this is part of who you are now. The neural pathway is solid. 
            Time to let it grow?
          </Text>
          
          {/* Subtext */}
          <Text style={[styles.subtext, { color: colors.text3 }]}>
            This is the invisible ratchet — your habits naturally evolving as you do.
          </Text>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.declineBtn, { backgroundColor: colors.bg2 }]}
              onPress={() => {
                haptics.select();
                onDecline?.();
              }}
            >
              <Text style={[styles.declineBtnText, { color: colors.text2 }]}>
                Not Yet
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.acceptBtn, { backgroundColor: colors.success }]}
              onPress={() => {
                haptics.success();
                onAccept?.();
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptBtnText}>Level Up</Text>
            </TouchableOpacity>
          </View>
          
          {/* Dismiss */}
          <TouchableOpacity 
            style={styles.dismissBtn}
            onPress={onDismiss}
          >
            <Text style={[styles.dismissText, { color: colors.text3 }]}>
              Remind me later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// RATCHET DOWN SUGGESTION
// Shows when consistency is too low (suggests reducing target)
// ═══════════════════════════════════════════════════════════════

export const RatchetDownBanner = ({
  visible,
  ratchetData,
  onAccept,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  
  if (!visible || !ratchetData) return null;
  
  return (
    <View style={[styles.banner, { backgroundColor: colors.warningLight }]}>
      <View style={styles.bannerContent}>
        <View style={styles.bannerIcon}>
          <Ionicons name="trending-down" size={20} color={colors.warning} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            {ratchetData.habitName} might be too ambitious
          </Text>
          <Text style={[styles.bannerMessage, { color: colors.text2 }]}>
            {ratchetData.consistency}% completion. Maybe {ratchetData.suggestedTarget} instead of {ratchetData.currentTarget}?
          </Text>
        </View>
      </View>
      
      <View style={styles.bannerActions}>
        <TouchableOpacity 
          onPress={() => {
            haptics.select();
            onDismiss?.();
          }}
        >
          <Text style={[styles.bannerActionText, { color: colors.text3 }]}>
            Keep it
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            haptics.tap();
            onAccept?.();
          }}
        >
          <Text style={[styles.bannerActionText, { color: colors.warning }]}>
            Adjust
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// RATCHET HISTORY CARD
// Shows progression over time
// ═══════════════════════════════════════════════════════════════

export const RatchetHistoryCard = ({
  habit,
  ratchetHistory = {},
}) => {
  const { colors } = useTheme();
  
  const habitHistory = ratchetHistory[habit.id];
  
  if (!habitHistory) {
    return null;
  }
  
  const allRatchets = Array.isArray(habitHistory) ? habitHistory : [habitHistory];
  
  return (
    <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyTitle, { color: colors.text }]}>
        Growth Timeline
      </Text>
      
      <View style={styles.timeline}>
        {allRatchets.map((ratchet, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { 
              backgroundColor: ratchet.direction === 'up' ? colors.success : colors.warning 
            }]} />
            {index < allRatchets.length - 1 && (
              <View style={[styles.timelineLine, { backgroundColor: colors.bg3 }]} />
            )}
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineDate, { color: colors.text3 }]}>
                {new Date(ratchet.date).toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric' 
                })}
              </Text>
              <Text style={[styles.timelineChange, { color: colors.text }]}>
                {ratchet.previousTarget} → {ratchet.newTarget}
              </Text>
            </View>
          </View>
        ))}
        
        {/* Current */}
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineDate, { color: colors.text3 }]}>Now</Text>
            <Text style={[styles.timelineChange, { color: colors.accent }]}>
              {habit.amount} {habit.unit}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  habitCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  targetChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  oldTarget: {
    fontSize: 20,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  newTarget: {
    fontSize: 24,
    fontWeight: '800',
  },
  consistencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  consistencyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  dismissBtn: {
    marginTop: 16,
    padding: 8,
  },
  dismissText: {
    fontSize: 13,
  },
  
  // Banner styles
  banner: {
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  bannerActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // History card
  historyCard: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 14,
    width: 2,
    height: 24,
  },
  timelineContent: {
    marginLeft: 12,
  },
  timelineDate: {
    fontSize: 11,
    marginBottom: 2,
  },
  timelineChange: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RatchetUpModal;
