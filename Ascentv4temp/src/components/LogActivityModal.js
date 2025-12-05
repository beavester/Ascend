// Log Activity Modal
// For manually logging recharge and drain activities

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { RECHARGE_ACTIVITIES, logRechargeActivity, logDrainActivity } from '../services/dopaminePool';

// ═══════════════════════════════════════════════════════════════
// RECHARGE ACTIVITY OPTIONS
// ═══════════════════════════════════════════════════════════════
const RECHARGE_OPTIONS = [
  { id: 'exercise_light', label: 'Light exercise', icon: '🚶', boost: 8, category: 'exercise' },
  { id: 'exercise_moderate', label: 'Workout', icon: '🏃', boost: 15, category: 'exercise' },
  { id: 'meditation', label: 'Meditation', icon: '🧘', boost: 10, category: 'meditation' },
  { id: 'outdoors', label: 'Time outside', icon: '🌳', boost: 8, category: 'outdoors' },
  { id: 'sunlight', label: 'Morning sunlight', icon: '☀️', boost: 10, category: 'outdoors' },
  { id: 'social', label: 'Quality time with others', icon: '👥', boost: 10, category: 'social' },
  { id: 'cold', label: 'Cold shower', icon: '🧊', boost: 12, category: 'coldExposure' },
  { id: 'nap', label: 'Power nap', icon: '😴', boost: 8, category: 'rest' },
];

// ═══════════════════════════════════════════════════════════════
// DRAIN ACTIVITY OPTIONS (for manual logging)
// ═══════════════════════════════════════════════════════════════
const DRAIN_OPTIONS = [
  { id: 'social_media', label: 'Social media scrolling', icon: '📱', drain: -1.5 },
  { id: 'video', label: 'Video streaming', icon: '📺', drain: -0.8 },
  { id: 'news', label: 'News/doom scrolling', icon: '📰', drain: -1.0 },
  { id: 'gaming', label: 'Gaming', icon: '🎮', drain: -0.5 },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const LogActivityModal = ({
  visible,
  onClose,
  onLogRecharge,
  onLogDrain,
  currentPoolLevel,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState('recharge');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  
  const handleSelectActivity = (activity) => {
    haptics.select();
    setSelectedActivity(activity);
  };
  
  const handleLog = () => {
    if (!selectedActivity) return;
    
    haptics.success();
    
    if (activeTab === 'recharge') {
      onLogRecharge({
        ...selectedActivity,
        timestamp: new Date().toISOString(),
      });
    } else {
      const minutes = parseInt(customMinutes) || 15;
      onLogDrain({
        ...selectedActivity,
        minutes,
        impact: Math.round(selectedActivity.drain * minutes),
        timestamp: new Date().toISOString(),
      });
    }
    
    setSelectedActivity(null);
    setCustomMinutes('');
    onClose();
  };
  
  const options = activeTab === 'recharge' ? RECHARGE_OPTIONS : DRAIN_OPTIONS;
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Log Activity</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text3} />
            </TouchableOpacity>
          </View>
          
          {/* Tab switcher */}
          <View style={[styles.tabs, { backgroundColor: colors.bg2 }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'recharge' && { backgroundColor: colors.card }
              ]}
              onPress={() => {
                haptics.select();
                setActiveTab('recharge');
                setSelectedActivity(null);
              }}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'recharge' ? colors.success : colors.text3 }
              ]}>
                ⚡ Recharge
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'drain' && { backgroundColor: colors.card }
              ]}
              onPress={() => {
                haptics.select();
                setActiveTab('drain');
                setSelectedActivity(null);
              }}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'drain' ? colors.warning : colors.text3 }
              ]}>
                📉 Drain
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Current pool level indicator */}
          <View style={[styles.poolIndicator, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.poolLabel, { color: colors.text3 }]}>Current pool:</Text>
            <Text style={[styles.poolValue, { color: colors.accent }]}>{currentPoolLevel}%</Text>
          </View>
          
          {/* Activity options */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {options.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.optionCard,
                  { 
                    backgroundColor: colors.bg2,
                    borderColor: selectedActivity?.id === activity.id 
                      ? (activeTab === 'recharge' ? colors.success : colors.warning)
                      : 'transparent',
                  }
                ]}
                onPress={() => handleSelectActivity(activity)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{activity.icon}</Text>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {activity.label}
                  </Text>
                  <Text style={[
                    styles.optionImpact,
                    { color: activeTab === 'recharge' ? colors.success : colors.warning }
                  ]}>
                    {activeTab === 'recharge' 
                      ? `+${activity.boost}%`
                      : `${activity.drain}% per min`
                    }
                  </Text>
                </View>
                {selectedActivity?.id === activity.id && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={22} 
                    color={activeTab === 'recharge' ? colors.success : colors.warning} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Duration input for drain activities */}
          {activeTab === 'drain' && selectedActivity && (
            <View style={styles.durationInput}>
              <Text style={[styles.durationLabel, { color: colors.text2 }]}>
                How many minutes?
              </Text>
              <TextInput
                style={[styles.durationField, { 
                  backgroundColor: colors.bg2, 
                  color: colors.text,
                  borderColor: colors.bg3,
                }]}
                keyboardType="numeric"
                value={customMinutes}
                onChangeText={setCustomMinutes}
                placeholder="15"
                placeholderTextColor={colors.text3}
              />
            </View>
          )}
          
          {/* Log button */}
          <TouchableOpacity
            style={[
              styles.logBtn,
              { 
                backgroundColor: selectedActivity 
                  ? (activeTab === 'recharge' ? colors.success : colors.warning)
                  : colors.bg3
              }
            ]}
            onPress={handleLog}
            disabled={!selectedActivity}
          >
            <Text style={[
              styles.logBtnText,
              { color: selectedActivity ? '#fff' : colors.text3 }
            ]}>
              {selectedActivity 
                ? `Log ${activeTab === 'recharge' ? '+' : ''}${
                    activeTab === 'recharge' 
                      ? selectedActivity.boost 
                      : Math.round(selectedActivity.drain * (parseInt(customMinutes) || 15))
                  }%`
                : 'Select an activity'
              }
            </Text>
          </TouchableOpacity>
          
          {/* Explanation */}
          <Text style={[styles.explanation, { color: colors.text3 }]}>
            {activeTab === 'recharge' 
              ? "Recharge activities replenish your motivation reserves."
              : "Logging drains helps you see patterns. No judgment."
            }
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  poolIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  poolLabel: {
    fontSize: 13,
  },
  poolValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionsList: {
    maxHeight: 280,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionImpact: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  durationInput: {
    marginTop: 12,
    marginBottom: 8,
  },
  durationLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  durationField: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  logBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});

export default LogActivityModal;
