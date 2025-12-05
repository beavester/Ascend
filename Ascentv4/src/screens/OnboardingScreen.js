import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Defs, LinearGradient as SvgGradient, Stop, Path, Circle, G, Line, Rect } from 'react-native-svg';
import { AscentLogo } from './SplashScreen';
import { colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { id: 0, type: 'hero' },
  { id: 1, type: 'problem', bg: ['#1a1a2e', '#16213e'] },
  { id: 2, type: 'dopamine', bg: ['#1e1b4b', '#312e81'] },
  { id: 3, type: 'exercise', bg: ['#064e3b', '#065f46'] },
  { id: 4, type: 'atomic', bg: ['#7c2d12', '#9a3412'] },
  { id: 5, type: 'starting', bg: ['#1e3a5f', '#1e40af'] },
  { id: 6, type: 'solution', bg: ['#0f172a', '#1e293b'] },
  { id: 7, type: 'final' },
];

// Hero mountain background component
const MountainBackground = () => (
  <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
    <Defs>
      <SvgGradient id="mt1" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#1e3a5f" />
        <Stop offset="100%" stopColor="#0f172a" />
      </SvgGradient>
      <SvgGradient id="mt2" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#2d4a6f" />
        <Stop offset="100%" stopColor="#1e3a5f" />
      </SvgGradient>
    </Defs>
    <Polygon fill="url(#mt1)" points="0,200 100,80 200,140 300,40 400,100 400,200" />
    <Polygon fill="url(#mt2)" points="0,200 50,120 150,160 250,90 350,130 400,200" opacity="0.7" />
    <Polygon fill="#f1f5f9" points="295,45 300,40 305,45" opacity="0.8" />
  </Svg>
);

// Stars component
const Stars = () => (
  <View style={StyleSheet.absoluteFill}>
    {[
      { top: '10%', left: '20%' },
      { top: '15%', left: '70%' },
      { top: '25%', left: '40%' },
      { top: '8%', left: '85%' },
      { top: '30%', left: '15%' },
    ].map((pos, i) => (
      <View key={i} style={[styles.star, { top: pos.top, left: pos.left }]} />
    ))}
  </View>
);

// Slide 1: Hero
const HeroSlide = () => (
  <LinearGradient colors={['#0f172a', '#1e3a5f']} style={styles.slide}>
    <Stars />
    <View style={styles.mountainBg}>
      <MountainBackground />
    </View>
    <View style={styles.heroContent}>
      <View style={styles.heroIcon}>
        <AscentLogo size={60} />
      </View>
      <Text style={styles.heroTitle}>Ascent</Text>
      <Text style={styles.heroSubtitle}>
        Your brain is wired for progress. Let's use that to build the life you want.
      </Text>
      <View style={styles.tagline}>
        <Text style={styles.taglineText}>✨ Powered by neuroscience</Text>
      </View>
    </View>
  </LinearGradient>
);

// Slide 2: The Problem
const ProblemSlide = () => (
  <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <View style={styles.phoneIcon}>
          <Text style={styles.phoneEmoji}>📱</Text>
        </View>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#f87171' }]}>⚠️ The Problem</Text>
      </View>
      <Text style={styles.slideTitle}>Your brain is being hijacked</Text>
      <Text style={styles.slideText}>
        Social media, games, and apps are designed by teams of scientists to be{' '}
        <Text style={styles.highlightOrange}>as addictive as possible</Text>. They've figured out exactly how to hijack your brain's reward system.
      </Text>
      <Text style={styles.slideText}>
        Every notification, every like, every scroll gives you a tiny hit of{' '}
        <Text style={styles.highlightPurple}>dopamine</Text>. It feels good in the moment, but it's training your brain to crave{' '}
        <Text style={styles.highlightBlue}>easy rewards</Text> instead of meaningful ones.
      </Text>
    </ScrollView>
  </LinearGradient>
);

// Slide 3: Dopamine Science
const DopamineSlide = () => (
  <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <View style={styles.appIcons}>
          <View style={styles.appIcon}><Text style={styles.appEmoji}>📱</Text><Text style={styles.appLabel}>TikTok</Text></View>
          <View style={styles.appIcon}><Text style={styles.appEmoji}>▶️</Text><Text style={styles.appLabel}>Shorts</Text></View>
          <View style={styles.appIcon}><Text style={styles.appEmoji}>𝕏</Text><Text style={styles.appLabel}>Scroll</Text></View>
        </View>
        <Text style={styles.spikeLabel}>↑ Constant dopamine spikes</Text>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#a78bfa' }]}>🧠 The Science</Text>
      </View>
      <Text style={styles.slideTitle}>The dopamine trap</Text>
      <Text style={styles.slideText}>
        Every TikTok, every YouTube Short, every X scroll gives you a{' '}
        <Text style={styles.highlightOrange}>massive dopamine hit</Text> for zero effort.
      </Text>
      <Text style={styles.slideText}>
        But here's what they don't tell you:{' '}
        <Text style={styles.highlightPurple}>dopamine isn't about pleasure—it's about wanting</Text>. It's the chemical that makes you get up and chase things.
      </Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>⚡ The problem</Text>
        <Text style={styles.infoCardText}>
          When you burn your dopamine on <Text style={{ fontWeight: '700' }}>empty consumption</Text>, you train your brain to expect easy rewards. Real goals—which require effort—start to feel impossible.
        </Text>
      </View>
      <Text style={styles.slideText}>
        The fix isn't to eliminate dopamine. It's to{' '}
        <Text style={styles.highlightGreen}>redirect it</Text> toward things that actually build your life.
      </Text>
    </ScrollView>
  </LinearGradient>
);

// Slide 4: Exercise Science
const ExerciseSlide = () => (
  <LinearGradient colors={['#064e3b', '#065f46']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <Text style={{ fontSize: 48 }}>🏃</Text>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#6ee7b7' }]}>💪 Exercise Science</Text>
      </View>
      <Text style={styles.slideTitle}>Your body's natural high</Text>
      <Text style={styles.slideText}>
        Exercise triggers your body's{' '}
        <Text style={styles.highlightGreen}>endocannabinoid system</Text>—the same pathways activated by cannabis, but naturally and sustainably.
      </Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>🍃 The catch</Text>
        <Text style={styles.infoCardText}>
          When you use marijuana regularly, external THC <Text style={{ fontWeight: '700' }}>hijacks these same receptors</Text>. Over time, your brain downregulates them—making it harder to feel motivated without it. Exercise does the opposite: it <Text style={{ fontStyle: 'italic' }}>builds</Text> the system.
        </Text>
      </View>
    </ScrollView>
  </LinearGradient>
);

// Slide 5: Atomic Habits
const AtomicSlide = () => (
  <LinearGradient colors={['#7c2d12', '#9a3412']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <Text style={{ fontSize: 48 }}>⚛️</Text>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#fb923c' }]}>📚 Habit Science</Text>
      </View>
      <Text style={styles.slideTitle}>Tiny changes, remarkable results</Text>
      <View style={styles.percentBadge}>
        <Text style={styles.percentBig}>1%</Text>
        <Text style={styles.percentSmall}>better every day = <Text style={{ fontWeight: '700' }}>37x</Text> better in a year</Text>
      </View>
      <Text style={styles.slideText}>
        Most people fail because they try too much, too fast. But{' '}
        <Text style={styles.highlightOrange}>showing up matters more than crushing it</Text>.
      </Text>
      <View style={styles.habitEquation}>
        <View style={styles.habitStep}><Text style={styles.habitStepIcon}>👀</Text><Text style={styles.habitStepLabel}>See It</Text></View>
        <Text style={styles.habitArrow}>→</Text>
        <View style={styles.habitStep}><Text style={styles.habitStepIcon}>💫</Text><Text style={styles.habitStepLabel}>Want It</Text></View>
        <Text style={styles.habitArrow}>→</Text>
        <View style={styles.habitStep}><Text style={styles.habitStepIcon}>⚡</Text><Text style={styles.habitStepLabel}>Do It</Text></View>
        <Text style={styles.habitArrow}>→</Text>
        <View style={styles.habitStep}><Text style={styles.habitStepIcon}>🎁</Text><Text style={styles.habitStepLabel}>Reward</Text></View>
      </View>
    </ScrollView>
  </LinearGradient>
);

// Slide 6: Starting
const StartingSlide = () => (
  <LinearGradient colors={['#1e3a5f', '#1e40af']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <Text style={{ fontSize: 48 }}>🚀</Text>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#22d3ee' }]}>🎯 Real Talk</Text>
      </View>
      <Text style={styles.slideTitle}>Starting is the hardest part</Text>
      <View style={styles.truthBomb}>
        <Text style={styles.truthBombText}>"The hardest part of any journey is lacing up your shoes."</Text>
      </View>
      <Text style={styles.slideText}>
        Your brain is wired to avoid effort—it's{' '}
        <Text style={styles.highlightBlue}>evolution</Text>. The secret?{' '}
        <Text style={styles.highlightGreen}>Make starting stupidly easy</Text>.
      </Text>
      <View style={styles.twoMinPreview}>
        <Text style={styles.twoMinIcon}>⚡</Text>
        <View style={styles.twoMinContent}>
          <Text style={styles.twoMinTitle}>The 2-Minute Rule</Text>
          <Text style={styles.twoMinText}>
            Every habit has a tiny version. Can't run 5 miles? Just put on your shoes. The goal is to <Text style={{ fontWeight: '700' }}>show up</Text>.
          </Text>
        </View>
      </View>
    </ScrollView>
  </LinearGradient>
);

// Slide 7: The Solution
const SolutionSlide = () => (
  <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.slide}>
    <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
      <View style={styles.visual}>
        <View style={styles.featuresPreview}>
          <View style={styles.featureCard}><Text style={styles.featureIcon}>🔥</Text><Text style={styles.featureName}>Streak Flames</Text></View>
          <View style={styles.featureCard}><Text style={styles.featureIcon}>⭕</Text><Text style={styles.featureName}>Daily Rings</Text></View>
          <View style={styles.featureCard}><Text style={styles.featureIcon}>🏔️</Text><Text style={styles.featureName}>Mountain Climb</Text></View>
        </View>
      </View>
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: '#60a5fa' }]}>✨ The Solution</Text>
      </View>
      <Text style={styles.slideTitle}>Ascent redirects your dopamine</Text>
      <Text style={styles.slideText}>
        We took the psychology that makes apps addictive and pointed it at{' '}
        <Text style={styles.highlightBlue}>things that actually matter</Text>.
      </Text>
      <View style={styles.promiseList}>
        {[
          'AI breaks big goals into daily micro-tasks',
          'Satisfying visuals that reward consistency',
          '2-minute versions when you\'re struggling',
          'No shame, no guilt—just gentle momentum',
        ].map((text, i) => (
          <View key={i} style={styles.promiseItem}>
            <View style={styles.promiseCheck}><Text style={{ color: '#22c55e' }}>✓</Text></View>
            <Text style={styles.promiseText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  </LinearGradient>
);

// Slide 8: Final - Let's Go
const FinalSlide = ({ onStart }) => (
  <LinearGradient colors={['#0f172a', '#1e3a5f']} style={styles.slide}>
    <Stars />
    <View style={styles.mountainBg}>
      <MountainBackground />
    </View>
    <View style={styles.heroContent}>
      <View style={styles.heroIcon}>
        <AscentLogo size={60} />
      </View>
      <Text style={styles.heroTitle}>Ready to climb?</Text>
      <Text style={styles.heroSubtitle}>
        Every summit starts with a single step. Let's design yours.
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startButtonText}>Let's Go →</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

export default function OnboardingScreen({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef(null);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    }
  };

  const handleSkip = () => {
    setCurrentSlide(SLIDES.length - 1);
    scrollRef.current?.scrollTo({ x: (SLIDES.length - 1) * width, animated: true });
  };

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== currentSlide) {
      setCurrentSlide(slide);
    }
  };

  const renderSlide = (slide) => {
    switch (slide.type) {
      case 'hero': return <HeroSlide key={slide.id} />;
      case 'problem': return <ProblemSlide key={slide.id} />;
      case 'dopamine': return <DopamineSlide key={slide.id} />;
      case 'exercise': return <ExerciseSlide key={slide.id} />;
      case 'atomic': return <AtomicSlide key={slide.id} />;
      case 'starting': return <StartingSlide key={slide.id} />;
      case 'solution': return <SolutionSlide key={slide.id} />;
      case 'final': return <FinalSlide key={slide.id} onStart={onComplete} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentSlide < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map(slide => (
          <View key={slide.id} style={{ width, height }}>
            {renderSlide(slide)}
          </View>
        ))}
      </ScrollView>

      {/* Navigation dots and next button */}
      {currentSlide < SLIDES.length - 1 && (
        <View style={styles.navigation}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentSlide && styles.dotActive]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    padding: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
  },
  mountainBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.6,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 80,
  },
  heroIcon: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  tagline: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  taglineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slideContent: {
    padding: 24,
    paddingTop: 100,
    paddingBottom: 120,
  },
  visual: {
    alignItems: 'center',
    marginBottom: 24,
  },
  phoneIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneEmoji: {
    fontSize: 40,
  },
  appIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  appIcon: {
    alignItems: 'center',
    opacity: 0.7,
  },
  appEmoji: {
    fontSize: 32,
  },
  appLabel: {
    fontSize: 10,
    color: '#a5b4fc',
    marginTop: 4,
  },
  spikeLabel: {
    fontSize: 10,
    color: '#f87171',
    marginTop: 12,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 34,
  },
  slideText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    marginBottom: 16,
  },
  highlightOrange: {
    color: '#fb923c',
    fontWeight: '600',
  },
  highlightPurple: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  highlightBlue: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  highlightGreen: {
    color: '#6ee7b7',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  percentBig: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  percentSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  habitEquation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  habitStep: {
    alignItems: 'center',
  },
  habitStepIcon: {
    fontSize: 24,
  },
  habitStepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  habitArrow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  truthBomb: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  truthBombText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  twoMinPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  twoMinIcon: {
    fontSize: 24,
  },
  twoMinContent: {
    flex: 1,
  },
  twoMinTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  twoMinText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  featuresPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  featureName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  promiseList: {
    marginTop: 16,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  promiseCheck: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promiseText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 32,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  navigation: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
