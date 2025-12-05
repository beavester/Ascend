// Pool Onboarding Component
// Educational slides explaining the dopamine pool concept on first view

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop, ClipPath, G } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { shadows } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// ONBOARDING SLIDES
// ═══════════════════════════════════════════════════════════════

const SLIDES = [
  {
    id: 'intro',
    title: 'Meet Your Drive Pool',
    description: "This vessel represents your available motivation — the biological capacity to start hard things.",
    illustration: 'pool',
  },
  {
    id: 'refill',
    title: 'It Refills Each Morning',
    description: "Sleep restores your pool. Yesterday's wins add momentum. Streaks build baseline capacity.",
    illustration: 'morning',
  },
  {
    id: 'drain',
    title: 'Some Things Drain It',
    description: "Social media, endless scrolling, dopamine-heavy apps — they withdraw from the same account you need for habits.",
    illustration: 'drain',
  },
  {
    id: 'recharge',
    title: 'Some Things Recharge It',
    description: "Exercise, sunlight, meditation, cold exposure — these are deposits that restore capacity.",
    illustration: 'recharge',
  },
  {
    id: 'strategy',
    title: 'The Strategy',
    description: "Hard habits when pool is high. 2-minute versions when it's low. This isn't about trying harder — it's about timing smarter.",
    illustration: 'strategy',
  },
  {
    id: 'nojudgment',
    title: 'No Judgment. Just Data.',
    description: "Low pool doesn't mean you failed. It means today is for maintenance mode. The pool is information, not a scorecard.",
    illustration: 'observe',
  },
];

// ═══════════════════════════════════════════════════════════════
// ANIMATED POOL ILLUSTRATION
// ═══════════════════════════════════════════════════════════════

const PoolIllustration = ({ type, animValue }) => {
  const { colors, isDark } = useTheme();
  
  const poolColors = {
    high: { fill: '#60a5fa', glow: '#93c5fd' },
    medium: { fill: '#fbbf24', glow: '#fde68a' },
    low: { fill: '#f87171', glow: '#fecaca' },
  };
  
  // Pool level based on illustration type
  const poolLevel = 
    type === 'pool' ? 70 :
    type === 'morning' ? 85 :
    type === 'drain' ? 35 :
    type === 'recharge' ? 80 :
    type === 'strategy' ? 60 :
    type === 'observe' ? 45 : 65;
  
  const poolColor = poolLevel >= 60 ? poolColors.high :
                    poolLevel >= 40 ? poolColors.medium : poolColors.low;
  
  const vesselHeight = 120;
  const vesselWidth = 60;
  const liquidHeight = (poolLevel / 100) * (vesselHeight - 20);
  
  return (
    <View style={styles.illustrationContainer}>
      <Svg width={160} height={160} viewBox="-50 -20 160 160">
        <Defs>
          <LinearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={poolColor.fill} stopOpacity="0.9" />
            <Stop offset="1" stopColor={poolColor.fill} stopOpacity="0.6" />
          </LinearGradient>
          <ClipPath id="vesselClip">
            <Rect x="5" y="5" width={vesselWidth - 10} height={vesselHeight - 10} rx="8" />
          </ClipPath>
        </Defs>
        
        {/* Outer glow for high pool */}
        {poolLevel >= 60 && (
          <Rect
            x="-4"
            y="-4"
            width={vesselWidth + 8}
            height={vesselHeight + 8}
            rx="14"
            fill={poolColor.glow}
            opacity="0.3"
          />
        )}
        
        {/* Vessel outline */}
        <Rect
          x="0"
          y="0"
          width={vesselWidth}
          height={vesselHeight}
          rx="10"
          fill={isDark ? '#1e293b' : '#f8fafc'}
          stroke={isDark ? '#334155' : '#e2e8f0'}
          strokeWidth="2"
        />
        
        {/* Liquid */}
        <G clipPath="url(#vesselClip)">
          <Rect
            x="5"
            y={vesselHeight - liquidHeight - 5}
            width={vesselWidth - 10}
            height={liquidHeight}
            fill="url(#liquidGradient)"
          />
          
          {/* Wave effect */}
          <Path
            d={`M 5 ${vesselHeight - liquidHeight - 5} 
                Q ${vesselWidth / 4} ${vesselHeight - liquidHeight - 8}, 
                  ${vesselWidth / 2} ${vesselHeight - liquidHeight - 5} 
                Q ${3 * vesselWidth / 4} ${vesselHeight - liquidHeight - 2}, 
                  ${vesselWidth - 5} ${vesselHeight - liquidHeight - 5}`}
            fill={poolColor.glow}
            opacity="0.4"
          />
        </G>
        
        {/* Measurement marks */}
        {[25, 50, 75].map(mark => (
          <React.Fragment key={mark}>
            <Rect
              x={vesselWidth - 12}
              y={vesselHeight - (mark / 100) * (vesselHeight - 20) - 8}
              width={6}
              height={1}
              fill={isDark ? '#64748b' : '#94a3b8'}
            />
          </React.Fragment>
        ))}
        
        {/* Type-specific icons */}
        {type === 'drain' && (
          <>
            {/* Down arrow */}
            <Path
              d="M 80 40 L 80 80 M 70 70 L 80 80 L 90 70"
              stroke={colors.warning}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Phone icon */}
            <Rect
              x="70"
              y="10"
              width="20"
              height="30"
              rx="3"
              fill={colors.warning}
              opacity="0.8"
            />
          </>
        )}
        
        {type === 'recharge' && (
          <>
            {/* Up arrow */}
            <Path
              d="M 80 80 L 80 40 M 70 50 L 80 40 L 90 50"
              stroke={colors.success}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Sun icon */}
            <Circle cx="80" cy="95" r="10" fill={colors.success} opacity="0.8" />
          </>
        )}
        
        {type === 'morning' && (
          <>
            {/* Sun rising */}
            <Circle cx="90" cy="0" r="20" fill="#fbbf24" opacity="0.6" />
            <Path
              d="M 70 0 L 110 0"
              stroke="#fbbf24"
              strokeWidth="2"
              opacity="0.8"
            />
          </>
        )}
        
        {type === 'strategy' && (
          <>
            {/* Clock/timing indicator */}
            <Circle
              cx="85"
              cy="60"
              r="15"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
            />
            <Path
              d="M 85 50 L 85 60 L 93 65"
              stroke={colors.accent}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
        
        {type === 'observe' && (
          <>
            {/* Eye/observe icon */}
            <Path
              d="M 65 60 Q 80 45 95 60 Q 80 75 65 60"
              fill="none"
              stroke={colors.text2}
              strokeWidth="2"
            />
            <Circle cx="80" cy="60" r="5" fill={colors.text2} />
          </>
        )}
      </Svg>
      
      {/* Level indicator */}
      <View style={styles.levelBadge}>
        <Text style={[styles.levelText, { color: poolColor.fill }]}>
          {poolLevel}%
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN ONBOARDING COMPONENT
// ═══════════════════════════════════════════════════════════════

export const PoolOnboarding = ({
  visible,
  onComplete,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;
  
  const animateTransition = (direction) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
      } else {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    }, 150);
  };
  
  const handleNext = () => {
    haptics.tap();
    if (isLastSlide) {
      haptics.success();
      onComplete?.();
    } else {
      animateTransition('next');
    }
  };
  
  const handleBack = () => {
    haptics.select();
    animateTransition('back');
  };
  
  const handleSkip = () => {
    haptics.tap();
    onComplete?.();
  };
  
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        {/* Skip button */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: colors.text3 }]}>Skip</Text>
        </TouchableOpacity>
        
        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Illustration */}
          <PoolIllustration type={slide.illustration} />
          
          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {slide.title}
            </Text>
            <Text style={[styles.description, { color: colors.text2 }]}>
              {slide.description}
            </Text>
          </View>
        </Animated.View>
        
        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentSlide ? colors.accent : colors.bg3,
                  width: i === currentSlide ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>
        
        {/* Navigation buttons */}
        <View style={styles.navigation}>
          {currentSlide > 0 ? (
            <TouchableOpacity 
              style={[styles.backButton, { borderColor: colors.bg3 }]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, { color: colors.text2 }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          
          <TouchableOpacity 
            style={[styles.nextButton, { backgroundColor: colors.accent }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? "Let's Go" : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUICK POOL TIP (for contextual help)
// ═══════════════════════════════════════════════════════════════

export const QuickPoolTip = ({
  visible,
  poolLevel,
  onDismiss,
}) => {
  const { colors } = useTheme();
  
  const getTip = () => {
    if (poolLevel >= 70) {
      return {
        icon: '🎯',
        title: 'High Pool',
        message: "Prime time for challenging habits. Your brain has resources to overcome resistance.",
      };
    } else if (poolLevel >= 40) {
      return {
        icon: '⚡',
        title: 'Moderate Pool',
        message: "Good for established routines. Save challenging new habits for tomorrow morning.",
      };
    } else {
      return {
        icon: '🌱',
        title: 'Low Pool',
        message: "2-minute versions today. Showing up matters more than intensity. Protect the chain.",
      };
    }
  };
  
  const tip = getTip();
  
  if (!visible) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.tipContainer, { backgroundColor: colors.card }]}
      onPress={onDismiss}
      activeOpacity={0.9}
    >
      <Text style={styles.tipIcon}>{tip.icon}</Text>
      <View style={styles.tipContent}>
        <Text style={[styles.tipTitle, { color: colors.text }]}>
          {tip.title}
        </Text>
        <Text style={[styles.tipMessage, { color: colors.text2 }]}>
          {tip.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  levelBadge: {
    marginTop: 12,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingBottom: 40,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Quick tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    ...shadows.md,
  },
  tipIcon: {
    fontSize: 28,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  tipMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PoolOnboarding;
