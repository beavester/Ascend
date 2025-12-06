import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, Flame, Sparkles } from 'lucide-react-native';
import { lightColors as colors, radius as borderRadius, shadows } from '../constants/theme';

const HabitCard = ({ 
  habit, 
  isDone, 
  streak, 
  onComplete, 
  onUncomplete,
  onGetTwoMin,
  twoMinData,
  isLoadingTwoMin,
}) => {
  const handlePress = () => {
    if (isDone) {
      onUncomplete(habit.id);
    } else {
      onComplete(habit.id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, isDone && styles.cardCompleted]}>
        <TouchableOpacity 
          style={[styles.check, isDone && styles.checkDone]} 
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {isDone && <Check size={16} color="#fff" strokeWidth={3} />}
        </TouchableOpacity>
        
        <View style={styles.info}>
          <Text style={[styles.name, isDone && styles.nameDone]}>{habit.name}</Text>
          <Text style={styles.meta}>{habit.goalAmount} {habit.unit}</Text>
        </View>
        
        {streak > 0 && (
          <View style={styles.streak}>
            <Flame size={14} color={colors.warning} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
        
        {!isDone && (
          <TouchableOpacity 
            style={styles.twoMinBtn}
            onPress={() => onGetTwoMin(habit)}
            disabled={isLoadingTwoMin}
          >
            {isLoadingTwoMin ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Sparkles size={16} color={colors.accent} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {twoMinData && (
        <View style={styles.twoMinPopup}>
          <View style={styles.twoMinBadge}>
            <Sparkles size={12} color={colors.warning} />
            <Text style={styles.twoMinBadgeText}>2-MINUTE VERSION</Text>
          </View>
          <Text style={styles.twoMinText}>{twoMinData.twoMinuteVersion}</Text>
          <Text style={styles.twoMinWhy}>{twoMinData.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity 
              style={[styles.twoMinBtn2, styles.twoMinBtnPrimary]}
              onPress={handlePress}
            >
              <Text style={styles.twoMinBtnTextPrimary}>Did It</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.twoMinBtn2}
              onPress={() => onGetTwoMin(null)}
            >
              <Text style={styles.twoMinBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  cardCompleted: {
    backgroundColor: colors.successLight,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: colors.text3,
  },
  meta: {
    fontSize: 13,
    color: colors.text3,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    marginLeft: 4,
  },
  twoMinBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoMinPopup: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: 8,
  },
  twoMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  twoMinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    marginLeft: 4,
  },
  twoMinText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  twoMinWhy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text2,
    marginBottom: 12,
  },
  twoMinActions: {
    flexDirection: 'row',
    gap: 8,
  },
  twoMinBtn2: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  twoMinBtnPrimary: {
    backgroundColor: colors.accent,
  },
  twoMinBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
  },
  twoMinBtnTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HabitCard;
