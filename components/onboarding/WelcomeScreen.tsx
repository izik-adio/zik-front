import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LogoImage } from '@/components/core/LogoImage';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(300).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={64} />
        </View>
        <Text style={styles.tagline}>Your Path, Illuminated</Text>
      </Animated.View>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(600).springify()}
      >
        <Text style={styles.welcome}>
          Welcome to your journey of growth and mindfulness
        </Text>
        <Text style={styles.description}>
          Transform your daily habits into epic quests and discover the power of
          consistent progress.
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInUp.delay(900).springify()}
      >
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f8fafc',
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
    color: '#64748b',
  },
  content: {
    alignItems: 'center',
    marginBottom: 60,
  },
  welcome: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f97316',
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
});
