// Settings Screen
// Comprehensive app settings including dopamine pool configuration

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { shadows } from '../constants/theme';

// ═══════════════════════════════════════════════════════════════
// SETTINGS SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SettingsScreen({ 
  data, 
  onUpdateSettings, 
  onExportData,
  onClearData,
  onClose 
}) {
  const { colors, isDark, toggleTheme } = useTheme();
  const haptics = useHaptics();
  
  const [showAppMappings, setShowAppMappings] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  
  // Settings state
  const settings = data.settings || {};
  
  const updateSetting = (key, value) => {
    haptics.select();
    onUpdateSettings({ ...settings, [key]: value });
  };
  
  // ═══════════════════════════════════════════════════════════════
  // SETTINGS SECTIONS
  // ═══════════════════════════════════════════════════════════════
  
  const renderPoolSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Dopamine Pool
      </Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Show Pool on Today
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Display the dopamine vessel at the top of the Today tab
          </Text>
        </View>
        <Switch
          value={settings.showDopaminePool !== false}
          onValueChange={(v) => updateSetting('showDopaminePool', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Pool Breakdown
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Show detailed drain/recharge breakdown in pool view
          </Text>
        </View>
        <Switch
          value={settings.showPoolBreakdown !== false}
          onValueChange={(v) => updateSetting('showPoolBreakdown', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <TouchableOpacity 
        style={styles.settingRow}
        onPress={() => {
          haptics.tap();
          setShowAppMappings(true);
        }}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            App Drain Mappings
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Customize which apps drain more or less
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text3} />
      </TouchableOpacity>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Friday Easy Mode
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Auto-suggest 2-min versions on Fridays (detected as high-friction day)
          </Text>
        </View>
        <Switch
          value={settings.fridayEasyMode === true}
          onValueChange={(v) => updateSetting('fridayEasyMode', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
    </View>
  );
  
  const renderHabitSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Habits & Streaks
      </Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Resilient Streaks
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Use 30-day consistency instead of binary streaks
          </Text>
        </View>
        <Switch
          value={settings.resilientStreaks !== false}
          onValueChange={(v) => updateSetting('resilientStreaks', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Variable Rewards
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Show randomized acknowledgments on completion
          </Text>
        </View>
        <Switch
          value={settings.variableRewards !== false}
          onValueChange={(v) => updateSetting('variableRewards', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Rave Mode
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Unleash chaos on 2-min task completion
          </Text>
        </View>
        <Switch
          value={settings.raveMode === true}
          onValueChange={(v) => updateSetting('raveMode', v)}
          trackColor={{ false: colors.bg3, true: '#FF00FF' }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Auto 2-Min Prompt
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Show 2-min version when pool is low
          </Text>
        </View>
        <Switch
          value={settings.autoTwoMinPrompt !== false}
          onValueChange={(v) => updateSetting('autoTwoMinPrompt', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Invisible Ratchet
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Auto-increase targets when consistency stays high
          </Text>
        </View>
        <Switch
          value={settings.invisibleRatchet === true}
          onValueChange={(v) => updateSetting('invisibleRatchet', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
    </View>
  );
  
  const renderNotificationSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Insights & Alerts
      </Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Proactive Insights
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Show pattern-based suggestions and tips
          </Text>
        </View>
        <Switch
          value={settings.proactiveInsights !== false}
          onValueChange={(v) => updateSetting('proactiveInsights', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Streak at Risk Alert
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Evening reminder when habits incomplete
          </Text>
        </View>
        <Switch
          value={settings.streakAtRiskAlert !== false}
          onValueChange={(v) => updateSetting('streakAtRiskAlert', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Miss Recovery Messages
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Show encouraging messages when returning after breaks
          </Text>
        </View>
        <Switch
          value={settings.missRecoveryMessages !== false}
          onValueChange={(v) => updateSetting('missRecoveryMessages', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
    </View>
  );
  
  const renderAppearanceSettings = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Appearance
      </Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Use dark color scheme
          </Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Haptic Feedback
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Vibration on completions and interactions
          </Text>
        </View>
        <Switch
          value={settings.hapticsEnabled !== false}
          onValueChange={(v) => updateSetting('hapticsEnabled', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Minimal Animations
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Reduce motion for accessibility
          </Text>
        </View>
        <Switch
          value={settings.minimalAnimations === true}
          onValueChange={(v) => updateSetting('minimalAnimations', v)}
          trackColor={{ false: colors.bg3, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? colors.card : undefined}
        />
      </View>
    </View>
  );
  
  const renderDataSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Data & Privacy
      </Text>
      
      <TouchableOpacity 
        style={styles.settingRow}
        onPress={() => {
          haptics.tap();
          setShowDataExport(true);
        }}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Export Data
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Download your habits, completions, and insights
          </Text>
        </View>
        <Ionicons name="download-outline" size={20} color={colors.accent} />
      </TouchableOpacity>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <TouchableOpacity 
        style={styles.settingRow}
        onPress={() => {
          haptics.warning();
          Alert.alert(
            "Reset All Data",
            "This will permanently delete all your habits, completions, and progress. This cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Reset Everything", 
                style: "destructive",
                onPress: () => {
                  haptics.deleteConfirm();
                  onClearData?.();
                }
              }
            ]
          );
        }}
      >
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: colors.danger }]}>
            Reset All Data
          </Text>
          <Text style={[styles.settingDescription, { color: colors.text3 }]}>
            Delete everything and start fresh
          </Text>
        </View>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
  
  const renderAboutSection = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        About
      </Text>
      
      <View style={styles.aboutContent}>
        <Text style={[styles.appName, { color: colors.text }]}>Ascent</Text>
        <Text style={[styles.appVersion, { color: colors.text3 }]}>Version 2.0.0</Text>
        <Text style={[styles.appTagline, { color: colors.text2 }]}>
          Behavioral pharmacokinetics for habit formation
        </Text>
      </View>
      
      <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
      
      <View style={styles.philosophyBox}>
        <Text style={[styles.philosophyTitle, { color: colors.text }]}>
          Core Philosophy
        </Text>
        <Text style={[styles.philosophyText, { color: colors.text2 }]}>
          • Showing up beats crushing it{'\n'}
          • Consistency over intensity{'\n'}
          • Observation without judgment{'\n'}
          • Neural pathways go dormant, not dead{'\n'}
          • The 2-minute version preserves the chain
        </Text>
      </View>
    </View>
  );
  
  // ═══════════════════════════════════════════════════════════════
  // APP MAPPINGS MODAL
  // ═══════════════════════════════════════════════════════════════
  
  const renderAppMappingsModal = () => {
    const defaultMappings = {
      'Twitter/X': { category: 'social', drainRate: -1.5 },
      'Instagram': { category: 'social', drainRate: -1.5 },
      'TikTok': { category: 'social', drainRate: -2.0 },
      'YouTube': { category: 'video', drainRate: -0.8 },
      'Netflix': { category: 'video', drainRate: -0.8 },
      'Reddit': { category: 'social', drainRate: -1.2 },
      'Messages': { category: 'communication', drainRate: -0.3 },
      'Email': { category: 'communication', drainRate: -0.3 },
      'Slack': { category: 'communication', drainRate: -0.5 },
    };
    
    const mappings = { ...defaultMappings, ...(data.poolData?.customAppMappings || {}) };
    
    return (
      <Modal visible={showAppMappings} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setShowAppMappings(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              App Drain Mappings
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.text2 }]}>
              Customize how much each app drains your pool. Higher drain = more motivation cost per minute.
            </Text>
            
            {Object.entries(mappings).map(([app, config]) => (
              <View 
                key={app} 
                style={[styles.mappingRow, { backgroundColor: colors.card }]}
              >
                <View style={styles.mappingInfo}>
                  <Text style={[styles.mappingApp, { color: colors.text }]}>{app}</Text>
                  <Text style={[styles.mappingCategory, { color: colors.text3 }]}>
                    {config.category}
                  </Text>
                </View>
                <View style={styles.mappingValue}>
                  <Text style={[styles.mappingDrain, { 
                    color: config.drainRate < -1 ? colors.warning : colors.text2 
                  }]}>
                    {config.drainRate}%/min
                  </Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.addMappingBtn, { backgroundColor: colors.accentLight }]}
              onPress={() => {
                haptics.tap();
                // Would open add mapping modal
                Alert.alert("Coming Soon", "Custom app mapping will be available in the next update.");
              }}
            >
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={[styles.addMappingText, { color: colors.accent }]}>
                Add Custom App
              </Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════
  // DATA EXPORT MODAL
  // ═══════════════════════════════════════════════════════════════
  
  const renderDataExportModal = () => {
    const stats = {
      habits: data.habits?.length || 0,
      completions: data.completions?.length || 0,
      streakDays: data.streakDays || 0,
      poolHistory: data.poolHistory?.length || 0,
    };
    
    return (
      <Modal visible={showDataExport} animationType="slide" transparent>
        <View style={styles.exportOverlay}>
          <View style={[styles.exportModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.exportTitle, { color: colors.text }]}>
              Export Your Data
            </Text>
            
            <View style={[styles.exportStats, { backgroundColor: colors.bg2 }]}>
              <View style={styles.exportStatRow}>
                <Text style={[styles.exportStatLabel, { color: colors.text3 }]}>Habits</Text>
                <Text style={[styles.exportStatValue, { color: colors.text }]}>{stats.habits}</Text>
              </View>
              <View style={styles.exportStatRow}>
                <Text style={[styles.exportStatLabel, { color: colors.text3 }]}>Completions</Text>
                <Text style={[styles.exportStatValue, { color: colors.text }]}>{stats.completions}</Text>
              </View>
              <View style={styles.exportStatRow}>
                <Text style={[styles.exportStatLabel, { color: colors.text3 }]}>Best Streak</Text>
                <Text style={[styles.exportStatValue, { color: colors.text }]}>{stats.streakDays} days</Text>
              </View>
              <View style={styles.exportStatRow}>
                <Text style={[styles.exportStatLabel, { color: colors.text3 }]}>Pool History</Text>
                <Text style={[styles.exportStatValue, { color: colors.text }]}>{stats.poolHistory} days</Text>
              </View>
            </View>
            
            <Text style={[styles.exportNote, { color: colors.text2 }]}>
              This is your investment. {stats.completions} repetitions building neural pathways. Export includes all habits, completion history, and pool data as JSON.
            </Text>
            
            <View style={styles.exportButtons}>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: colors.bg2 }]}
                onPress={() => setShowDataExport(false)}
              >
                <Text style={[styles.exportBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  haptics.success();
                  onExportData?.();
                  setShowDataExport(false);
                }}
              >
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={[styles.exportBtnText, { color: '#fff' }]}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPoolSettings()}
        {renderHabitSettings()}
        {renderNotificationSettings()}
        {renderAppearanceSettings()}
        {renderDataSection()}
        {renderAboutSection()}
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Modals */}
      {renderAppMappingsModal()}
      {renderDataExportModal()}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Sections
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  
  // Setting rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  
  // About section
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
  },
  appVersion: {
    fontSize: 12,
    marginTop: 4,
  },
  appTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  philosophyBox: {
    paddingTop: 12,
  },
  philosophyTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  philosophyText: {
    fontSize: 13,
    lineHeight: 22,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  
  // App mappings
  mappingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  mappingInfo: {
    flex: 1,
  },
  mappingApp: {
    fontSize: 15,
    fontWeight: '500',
  },
  mappingCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  mappingValue: {},
  mappingDrain: {
    fontSize: 14,
    fontWeight: '600',
  },
  addMappingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addMappingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Export modal
  exportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  exportModal: {
    borderRadius: 16,
    padding: 24,
  },
  exportTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  exportStats: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exportStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exportStatLabel: {
    fontSize: 14,
  },
  exportStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  exportNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
