import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { LogoImage } from '@/components/onboarding/LogoImage';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(300).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={64} />
        </View>
        <Text style={[styles.tagline, { color: theme.colors.subtitle }]}>
          Your Path, Illuminated
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(600).springify()}
      >
        <Text style={[styles.welcome, { color: theme.colors.text }]}>
          Welcome to your journey of growth and mindfulness
        </Text>
        <Text style={[styles.description, { color: theme.colors.subtitle }]}>
          Transform your daily habits into epic quests and discover the power of
          consistent progress.
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInUp.delay(900).springify()}
      >
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.ctaPrimary }]}
          onPress={onNext}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.skipButtonText, { color: theme.colors.subtitle }]}
            >
              Skip Setup
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 16,
  },
  tagline: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcome: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
  },
  skipButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});
