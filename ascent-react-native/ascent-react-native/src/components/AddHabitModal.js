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
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { colors, borderRadius, shadows } from '../constants/theme';
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Habit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.text2} />
            </TouchableOpacity>
          </View>

          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Habits compound.</Text> Small daily actions build toward your goal. Even 2 minutes counts—showing up matters more than duration.
            </Text>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>HABIT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Exercise, Read, Meditate"
                placeholderTextColor={colors.text3}
                value={name}
                onChangeText={setName}
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
                />
              </View>

              <View style={[styles.field, { flex: 1.5 }]}>
                <Text style={styles.label}>UNIT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
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
          </ScrollView>

          <TouchableOpacity
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
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
    padding: 4,
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
  },
  unitChipActive: {
    backgroundColor: colors.accent,
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
