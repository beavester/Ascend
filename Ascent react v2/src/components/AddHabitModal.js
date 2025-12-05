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
import { colors, radius as borderRadius, shadows } from '../constants/theme';
import { UNIT_OPTIONS } from '../constants/milestones';

const AddHabitModal = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState('minutes');

  const handleAdd = () => {
    if (!name.trim()) return;

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
              <View style={styles.container}>
                <View style={styles.header}>
                  <Text style={styles.title}>Add New Habit</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={colors.text2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.tip}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>
                    <Text style={styles.tipBold}>Habits compound.</Text> Small daily actions build toward your goal. Even 2 minutes counts—showing up matters more than duration.
                  </Text>
                </View>

                <ScrollView 
                  style={styles.form} 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.field}>
                    <Text style={styles.label}>HABIT NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Exercise, Read, Meditate"
                      placeholderTextColor={colors.text3}
                      value={name}
                      onChangeText={setName}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 12 }]}>
                      <Text style={styles.label}>AMOUNT</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="30"
                        placeholderTextColor={colors.text3}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.field, { flex: 1.5 }]}>
                      <Text style={styles.label}>UNIT</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.unitScroll}
                        keyboardShouldPersistTaps="handled"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.unitChip, unit === u && styles.unitChipActive]}
                            onPress={() => setUnit(u)}
                          >
                            <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                  
                  {/* Extra padding for keyboard */}
                  <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity
                  style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
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
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.bg2,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tip: {
    flexDirection: 'row',
    backgroundColor: colors.accentLight,
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
    color: colors.text2,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '700',
    color: colors.text,
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
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bg2,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.bg3,
  },
  row: {
    flexDirection: 'row',
  },
  unitScroll: {
    flexDirection: 'row',
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bg2,
    borderRadius: borderRadius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.bg3,
  },
  unitChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  unitChipTextActive: {
    color: '#fff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
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
});

export default AddHabitModal;
