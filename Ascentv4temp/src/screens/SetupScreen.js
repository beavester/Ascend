import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, EXPERIENCE_LEVELS, TIME_OPTIONS } from '../constants/theme';
import { generateCurriculum, generateDailyTasks } from '../services/ai';
import { Ionicons } from '@expo/vector-icons';

const STEPS = ['goal', 'context', 'level', 'time', 'generating', 'preview'];

export default function SetupScreen({ onComplete, initialData }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: initialData?.name || '',
    goal: '',
    goalContext: '',
    currentLevel: 'beginner',
    weeksAvailable: 8,
    curriculum: null,
    dailyTasks: [],
  });
  const [generating, setGenerating] = useState(false);

  const currentStep = STEPS[step];

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (currentStep === 'time') {
      // Start generating curriculum
      setStep(step + 1);
      setGenerating(true);
      
      try {
        const curriculum = await generateCurriculum({
          goal: data.goal,
          weeksAvailable: data.weeksAvailable,
          currentLevel: data.currentLevel,
          context: data.goalContext,
        });
        
        let milestone = 'Complete your tasks';
        if (curriculum?.phases?.[0]?.weeks?.[0]) {
          milestone = curriculum.phases[0].weeks[0].milestone;
        }
        
        const tasksResult = await generateDailyTasks({
          milestone,
          daysAvailable: 7,
          goalContext: data.goal,
        });
        
        setData(prev => ({
          ...prev,
          curriculum,
          dailyTasks: tasksResult.tasks || [],
        }));
      } catch (error) {
        console.error('Generation failed:', error);
      }
      
      setGenerating(false);
      setStep(step + 2); // Skip to preview
    } else if (currentStep === 'preview') {
      onComplete(data);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'goal': return data.goal.trim().length > 0;
      case 'context': return true; // Optional
      case 'level': return data.currentLevel;
      case 'time': return data.weeksAvailable > 0;
      case 'preview': return data.curriculum !== null;
      default: return true;
    }
  };

  const renderProgressBar = () => {
    const totalSteps = STEPS.length - 1; // Exclude generating
    const progress = Math.min(step, totalSteps - 1) / (totalSteps - 1);
    
    return (
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.progressBar}>
            <View style={[styles.progressFill, { width: i < step ? '100%' : i === step ? '50%' : '0%' }]} />
          </View>
        ))}
      </View>
    );
  };

  const renderGoalStep = () => (
    <>
      <Text style={styles.title}>What do you want to achieve?</Text>
      <Text style={styles.subtitle}>Be specific. "Learn Spanish" is better than "Be better at languages."</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>YOUR GOAL</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Run a 5K, Learn guitar basics, Read 20 books"
          placeholderTextColor={colors.text3}
          value={data.goal}
          onChangeText={(text) => updateData('goal', text)}
          multiline={false}
        />
      </View>
    </>
  );

  const renderContextStep = () => (
    <>
      <Text style={styles.title}>Any additional context?</Text>
      <Text style={styles.subtitle}>Help the AI understand your situation better.</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>CONTEXT (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="e.g., I have 30 mins in the morning, I've tried before but quit after 2 weeks..."
          placeholderTextColor={colors.text3}
          value={data.goalContext}
          onChangeText={(text) => updateData('goalContext', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </>
  );

  const renderLevelStep = () => (
    <>
      <Text style={styles.title}>What's your current level?</Text>
      <Text style={styles.subtitle}>This helps us calibrate the difficulty.</Text>
      <View style={styles.chipGroup}>
        {EXPERIENCE_LEVELS.map(level => (
          <TouchableOpacity
            key={level.value}
            style={[styles.chip, data.currentLevel === level.value && styles.chipSelected]}
            onPress={() => updateData('currentLevel', level.value)}
          >
            <Text style={[styles.chipLabel, data.currentLevel === level.value && styles.chipLabelSelected]}>
              {level.label}
            </Text>
            <Text style={[styles.chipDesc, data.currentLevel === level.value && styles.chipDescSelected]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderTimeStep = () => (
    <>
      <Text style={styles.title}>How long do you want to commit?</Text>
      <Text style={styles.subtitle}>We recommend 8 weeks—long enough to see real progress, short enough to stay focused.</Text>
      <View style={styles.timeChips}>
        {TIME_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.timeChip, data.weeksAvailable === opt.value && styles.timeChipSelected]}
            onPress={() => updateData('weeksAvailable', opt.value)}
          >
            <Text style={[styles.timeChipLabel, data.weeksAvailable === opt.value && styles.timeChipLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderGenerating = () => (
    <View style={styles.loadingCard}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Creating your personalized curriculum...</Text>
      <Text style={styles.loadingSubtext}>This takes about 10-15 seconds</Text>
    </View>
  );

  const renderPreview = () => {
    const c = data.curriculum;
    if (!c) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.title}>Your curriculum is ready!</Text>
        <Text style={styles.subtitle}>Here's your personalized plan to achieve: {data.goal}</Text>
        
        <View style={styles.curriculumCard}>
          <View style={styles.curriculumHeader}>
            <View style={styles.curriculumIcon}>
              <Ionicons name="trophy" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.curriculumTitle}>{c.title}</Text>
              <Text style={styles.curriculumMeta}>{c.totalWeeks} weeks • Personalized for you</Text>
            </View>
          </View>
          
          {c.phases?.map((phase, i) => (
            <View key={i} style={styles.phase}>
              <View style={styles.phaseHeader}>
                <View style={styles.phaseDot} />
                <Text style={styles.phaseName}>{phase.name}</Text>
              </View>
              <View style={styles.phaseWeeks}>
                {phase.weeks?.slice(0, 3).map((week, j) => (
                  <View key={j} style={styles.weekItem}>
                    <Text style={styles.weekNum}>Week {week.week}</Text>
                    <Text style={styles.weekMilestone}>{week.milestone}</Text>
                  </View>
                ))}
                {phase.weeks?.length > 3 && (
                  <Text style={styles.moreWeeks}>+{phase.weeks.length - 3} more weeks</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'goal': return renderGoalStep();
      case 'context': return renderContextStep();
      case 'level': return renderLevelStep();
      case 'time': return renderTimeStep();
      case 'generating': return renderGenerating();
      case 'preview': return renderPreview();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          {step > 0 && currentStep !== 'generating' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          {renderProgressBar()}
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {currentStep !== 'generating' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, !canProceed() && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!canProceed() || generating}
            >
              <Text style={styles.buttonText}>
                {currentStep === 'preview' ? "Let's Begin" : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bg3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text2,
    lineHeight: 22,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.bg3,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  chipGroup: {
    gap: 10,
  },
  chip: {
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  chipSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  chipLabelSelected: {
    color: colors.accent,
  },
  chipDesc: {
    fontSize: 13,
    color: colors.text3,
  },
  chipDescSelected: {
    color: colors.accent,
  },
  timeChips: {
    flexDirection: 'row',
    gap: 10,
  },
  timeChip: {
    flex: 1,
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  timeChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
  },
  timeChipLabelSelected: {
    color: colors.accent,
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text2,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
  },
  curriculumCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  curriculumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  curriculumIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  curriculumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  curriculumMeta: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 2,
  },
  phase: {
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  phaseDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  phaseWeeks: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.bg3,
  },
  weekItem: {
    paddingVertical: 10,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg2,
  },
  weekNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  weekMilestone: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  moreWeeks: {
    fontSize: 12,
    color: colors.text3,
    paddingLeft: 12,
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
