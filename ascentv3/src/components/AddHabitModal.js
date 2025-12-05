import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { radius as borderRadius } from '../constants/theme';

// ═══════════════════════════════════════════════════════════════
// UNIT CATEGORIES - Organized by type
// ═══════════════════════════════════════════════════════════════
const UNIT_CATEGORIES = [
  {
    name: 'Time',
    icon: 'time-outline',
    units: ['minutes', 'seconds', 'hours'],
  },
  {
    name: 'Count',
    icon: 'calculator-outline',
    units: ['times', 'count', 'reps', 'sets'],
  },
  {
    name: 'Weight',
    icon: 'barbell-outline',
    units: ['lbs', 'kg'],
  },
  {
    name: 'Distance',
    icon: 'walk-outline',
    units: ['miles', 'km', 'steps'],
  },
  {
    name: 'Other',
    icon: 'ellipsis-horizontal-outline',
    units: ['pages', 'glasses', 'words'],
  },
];

// ═══════════════════════════════════════════════════════════════
// UNIT PICKER MODAL
// ═══════════════════════════════════════════════════════════════
function UnitPickerModal({ visible, currentUnit, onSelect, onClose, colors }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.unitPickerOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.unitPickerContainer, { backgroundColor: colors.card }]}>
              <View style={styles.unitPickerHeader}>
                <Text style={[styles.unitPickerTitle, { color: colors.text }]}>Select Unit</Text>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={[styles.closeBtn, { backgroundColor: colors.bg2 }]}
                >
                  <Ionicons name="close" size={20} color={colors.text2} />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.unitPickerScroll}
                showsVerticalScrollIndicator={false}
              >
                {UNIT_CATEGORIES.map((category) => (
                  <View key={category.name} style={styles.unitCategory}>
                    <View style={styles.categoryHeader}>
                      <Ionicons name={category.icon} size={16} color={colors.text3} />
                      <Text style={[styles.categoryName, { color: colors.text3 }]}>
                        {category.name}
                      </Text>
                    </View>
                    <View style={styles.unitGrid}>
                      {category.units.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitOption,
                            { backgroundColor: colors.bg2, borderColor: colors.bg3 },
                            currentUnit === unit && { 
                              backgroundColor: colors.accent, 
                              borderColor: colors.accent 
                            }
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            onSelect(unit);
                          }}
                        >
                          <Text style={[
                            styles.unitOptionText,
                            { color: colors.text2 },
                            currentUnit === unit && { color: '#fff' }
                          ]}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD HABIT MODAL
// ═══════════════════════════════════════════════════════════════
const AddHabitModal = ({ visible, onClose, onAdd }) => {
  const { colors, shadows } = useTheme();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState('minutes');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    onAdd({
      name: name.trim(),
      goalAmount: parseInt(amount, 10) || 30,
      unit,
    });

    // Reset form
    setName('');
    setAmount('30');
    setUnit('minutes');
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };
  
  const handleUnitSelect = (selectedUnit) => {
    setUnit(selectedUnit);
    setShowUnitPicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <View style={[styles.container, { backgroundColor: colors.card }]}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>Add New Habit</Text>
                  <TouchableOpacity 
                    onPress={handleClose} 
                    style={[styles.closeBtn, { backgroundColor: colors.bg2 }]}
                  >
                    <Ionicons name="close" size={24} color={colors.text2} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.tip, { backgroundColor: colors.accentLight }]}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={[styles.tipText, { color: colors.text2 }]}>
                    <Text style={[styles.tipBold, { color: colors.text }]}>Habits compound.</Text> Small daily actions build toward your goal. Even 2 minutes counts—showing up matters more than duration.
                  </Text>
                </View>

                <ScrollView 
                  style={styles.form} 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Habit Name */}
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.text3 }]}>HABIT NAME</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          backgroundColor: colors.bg2, 
                          color: colors.text,
                          borderColor: colors.bg3 
                        }
                      ]}
                      placeholder="e.g., Exercise, Read, Meditate"
                      placeholderTextColor={colors.text3}
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                    />
                  </View>

                  {/* Amount and Unit in row */}
                  <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
                      <Text style={[styles.label, { color: colors.text3 }]}>AMOUNT</Text>
                      <TextInput
                        style={[
                          styles.input, 
                          { 
                            backgroundColor: colors.bg2, 
                            color: colors.text,
                            borderColor: colors.bg3 
                          }
                        ]}
                        placeholder="30"
                        placeholderTextColor={colors.text3}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.field, { flex: 1 }]}>
                      <Text style={[styles.label, { color: colors.text3 }]}>UNIT</Text>
                      <TouchableOpacity
                        style={[
                          styles.unitButton,
                          { 
                            backgroundColor: colors.bg2, 
                            borderColor: colors.bg3 
                          }
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          Keyboard.dismiss();
                          setShowUnitPicker(true);
                        }}
                      >
                        <Text style={[styles.unitButtonText, { color: colors.text }]}>
                          {unit}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.addBtn, 
                    { backgroundColor: colors.accent },
                    !name.trim() && styles.addBtnDisabled
                  ]}
                  onPress={handleAdd}
                  disabled={!name.trim()}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add Habit</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      
      {/* Unit Picker Modal */}
      <UnitPickerModal
        visible={showUnitPicker}
        currentUnit={unit}
        onSelect={handleUnitSelect}
        onClose={() => setShowUnitPicker(false)}
        colors={colors}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tip: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 20,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '700',
  },
  form: {
    marginBottom: 20,
    maxHeight: 300,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  
  // Unit button (replaces horizontal scroll)
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // Unit Picker Modal Styles
  // ═══════════════════════════════════════════════════════════════
  unitPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  unitPickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  unitPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  unitPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  unitPickerScroll: {
    maxHeight: 400,
  },
  unitCategory: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AddHabitModal;
