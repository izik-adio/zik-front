import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';
import { CheckCircle, Sparkles, Star, Trophy } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface CelebrationAnimationProps {
  visible: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
  type?: 'milestone' | 'epic' | 'task';
}

export function CelebrationAnimation({
  visible,
  title = 'Congratulations!',
  message = 'You completed a milestone!',
  onComplete,
  type = 'milestone',
}: CelebrationAnimationProps) {
  const { theme } = useTheme();
  const { width, height } = Dimensions.get('window');

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);

  // Confetti positions
  const confetti1X = useSharedValue(-50);
  const confetti2X = useSharedValue(width + 50);
  const confetti3X = useSharedValue(-30);
  const confetti4X = useSharedValue(width + 30);
  const confetti1Y = useSharedValue(-50);
  const confetti2Y = useSharedValue(-50);
  const confetti3Y = useSharedValue(-50);
  const confetti4Y = useSharedValue(-50);
  const confetti1Rotation = useSharedValue(0);
  const confetti2Rotation = useSharedValue(0);
  const confetti3Rotation = useSharedValue(0);
  const confetti4Rotation = useSharedValue(0);

  const getIcon = () => {
    switch (type) {
      case 'epic':
        return <Trophy size={48} color="#FFD700" />;
      case 'task':
        return <CheckCircle size={48} color="#10b981" />;
      case 'milestone':
      default:
        return <Star size={48} color={theme.colors.ctaPrimary} />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'epic':
        return {
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#FF6B6B',
        };
      case 'task':
        return {
          primary: '#10b981',
          secondary: '#34d399',
          accent: '#6ee7b7',
        };
      case 'milestone':
      default:
        return {
          primary: theme.colors.ctaPrimary,
          secondary: '#60a5fa',
          accent: '#93c5fd',
        };
    }
  };

  const colors = getColors();

  useEffect(() => {
    if (visible) {
      // Start the celebration animation
      backgroundOpacity.value = withTiming(1, { duration: 300 });

      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );

      opacity.value = withTiming(1, { duration: 400 });

      // Confetti animation
      confettiOpacity.value = withTiming(1, { duration: 300 });

      // Animate confetti falling
      confetti1X.value = withTiming(width * 0.2, { duration: 2000 });
      confetti1Y.value = withTiming(height + 100, { duration: 2000 });
      confetti1Rotation.value = withTiming(720, { duration: 2000 });

      confetti2X.value = withTiming(width * 0.8, { duration: 2200 });
      confetti2Y.value = withTiming(height + 100, { duration: 2200 });
      confetti2Rotation.value = withTiming(-720, { duration: 2200 });

      confetti3X.value = withTiming(width * 0.4, { duration: 1800 });
      confetti3Y.value = withTiming(height + 100, { duration: 1800 });
      confetti3Rotation.value = withTiming(540, { duration: 1800 });

      confetti4X.value = withTiming(width * 0.6, { duration: 2400 });
      confetti4Y.value = withTiming(height + 100, { duration: 2400 });
      confetti4Rotation.value = withTiming(-540, { duration: 2400 });

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  }, [visible]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(confettiOpacity);
      cancelAnimation(backgroundOpacity);
      cancelAnimation(confetti1X);
      cancelAnimation(confetti2X);
      cancelAnimation(confetti3X);
      cancelAnimation(confetti4X);
      cancelAnimation(confetti1Y);
      cancelAnimation(confetti2Y);
      cancelAnimation(confetti3Y);
      cancelAnimation(confetti4Y);
      cancelAnimation(confetti1Rotation);
      cancelAnimation(confetti2Rotation);
      cancelAnimation(confetti3Rotation);
      cancelAnimation(confetti4Rotation);
    };
  }, []);

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 300 });
    backgroundOpacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0, { duration: 300 });
    confettiOpacity.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
      // Reset values
      scale.value = 0;
      opacity.value = 0;
      confettiOpacity.value = 0;
      backgroundOpacity.value = 0;

      // Reset confetti positions
      confetti1X.value = -50;
      confetti2X.value = width + 50;
      confetti3X.value = -30;
      confetti4X.value = width + 30;
      confetti1Y.value = -50;
      confetti2Y.value = -50;
      confetti3Y.value = -50;
      confetti4Y.value = -50;
      confetti1Rotation.value = 0;
      confetti2Rotation.value = 0;
      confetti3Rotation.value = 0;
      confetti4Rotation.value = 0;

      onComplete?.();
    }, 300);
  };

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    backgroundColor: interpolateColor(
      backgroundOpacity.value,
      [0, 1],
      ['transparent', 'rgba(0, 0, 0, 0.8)']
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const confetti1Style = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [
      { translateX: confetti1X.value },
      { translateY: confetti1Y.value },
      { rotate: `${confetti1Rotation.value}deg` },
    ],
  }));

  const confetti2Style = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [
      { translateX: confetti2X.value },
      { translateY: confetti2Y.value },
      { rotate: `${confetti2Rotation.value}deg` },
    ],
  }));

  const confetti3Style = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [
      { translateX: confetti3X.value },
      { translateY: confetti3Y.value },
      { rotate: `${confetti3Rotation.value}deg` },
    ],
  }));

  const confetti4Style = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [
      { translateX: confetti4X.value },
      { translateY: confetti4Y.value },
      { rotate: `${confetti4Rotation.value}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, backgroundStyle]}>
        {/* Confetti */}
        <Animated.View style={[styles.confetti, confetti1Style]}>
          <Sparkles size={24} color={colors.primary} />
        </Animated.View>
        <Animated.View style={[styles.confetti, confetti2Style]}>
          <Star size={20} color={colors.secondary} />
        </Animated.View>
        <Animated.View style={[styles.confetti, confetti3Style]}>
          <Sparkles size={18} color={colors.accent} />
        </Animated.View>
        <Animated.View style={[styles.confetti, confetti4Style]}>
          <Star size={22} color={colors.primary} />
        </Animated.View>

        {/* Main Content */}
        <Animated.View style={[styles.container, containerStyle]}>
          <View
            style={[styles.content, { backgroundColor: theme.colors.card }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              {getIcon()}
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>

            <Text style={[styles.message, { color: theme.colors.subtitle }]}>
              {message}
            </Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 320,
  },
  content: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
  },
});
