import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { Target, Trophy, Sparkles } from 'lucide-react-native';
import { LogoImage } from '@/components/core/LogoImage';

interface IntroScreenProps {
  onNext: () => void;
}

export function IntroScreen({ onNext }: IntroScreenProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInLeft.delay(200).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={48} />
        </View>
        <Text style={styles.subtitle}>Your personal growth companion</Text>
      </Animated.View>

      <Animated.View
        style={styles.content}
        entering={FadeInRight.delay(400).springify()}
      >
        <Text style={styles.description}>
          I'm here to help you turn everyday tasks into meaningful quests, track
          your progress, and celebrate your wins along the way.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Target size={24} color="#14b8a6" />
            <Text style={styles.featureText}>Set and track daily goals</Text>
          </View>
          <View style={styles.feature}>
            <Trophy size={24} color="#f97316" />
            <Text style={styles.featureText}>Complete epic quests</Text>
          </View>
          <View style={styles.feature}>
            <Sparkles size={24} color="#8b5cf6" />
            <Text style={styles.featureText}>Get personalized guidance</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInRight.delay(600).springify()}
      >
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Let's Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    marginBottom: 48,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
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
