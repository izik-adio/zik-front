import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LogoImage } from './LogoImage';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);
  const glowScale = useSharedValue(0);
  useEffect(() => {
    // Start the animation sequence
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });

    // Glow effect
    setTimeout(() => {
      glowScale.value = withSequence(
        withTiming(1.5, { duration: 1000 }),
        withTiming(0, { duration: 600 })
      );
    }, 1000);

    // Complete splash after animation with longer duration to ensure visibility
    setTimeout(() => {
      backgroundOpacity.value = withTiming(0, { duration: 600 }, () => {
        runOnJS(onComplete)();
      });
    }, 2500);
  }, [logoOpacity, logoScale, glowScale, backgroundOpacity, onComplete]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowScale.value * 0.3,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />

      {/* Glow effect behind logo */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <LogoImage size={120} style={styles.logo} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: '#14b8a6', // Teal background
    opacity: 0.95,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f97316', // Orange glow
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    zIndex: 2,
  },
  logo: {
    tintColor: '#ffffff',
  },
});
