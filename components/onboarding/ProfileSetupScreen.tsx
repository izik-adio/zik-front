import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LogoImage } from '@/components/core/LogoImage';

interface ProfileSetupScreenProps {
  onNext: (data: { name: string }) => void;
  userData: { name: string };
}

export function ProfileSetupScreen({
  onNext,
  userData,
}: ProfileSetupScreenProps) {
  const [name, setName] = useState(userData.name || '');
  const [isFocused, setIsFocused] = useState(false);

  const handleNext = () => {
    if (name.trim()) {
      onNext({ name: name.trim() });
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={48} />
        </View>
        <Text style={styles.title}>Let&apos;s get to know you</Text>
        <Text style={styles.subtitle}>What should I call you?</Text>
      </Animated.View>

      <Animated.View
        style={styles.content}
        entering={FadeInUp.delay(400).springify()}
      >
        <TextInput
          style={[
            styles.input,
            isFocused && { borderColor: '#f97316' }, // Orange focus border
          ]}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        <Text style={styles.hint}>
          I&apos;ll use this to personalize your experience and cheer you on!
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInUp.delay(600).springify()}
      >
        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!name.trim()}
        >
          <Text
            style={[
              styles.buttonText,
              !name.trim() && styles.buttonTextDisabled,
            ]}
          >
            Continue
          </Text>
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
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  content: {
    marginBottom: 48,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
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
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#94a3b8',
  },
});
