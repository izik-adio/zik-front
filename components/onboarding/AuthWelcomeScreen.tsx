import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { LogoImage } from '@/components/onboarding/LogoImage';
import { UserPlus, LogIn } from 'lucide-react-native';
import { storage } from '@/src/utils/storage';

export function AuthWelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Mark that user has seen the auth welcome screen
    const markAuthWelcomeSeen = async () => {
      try {
        await storage.setItem('hasSeenAuthWelcome', 'true');
      } catch (error) {
        console.error('Error marking auth welcome as seen:', error);
      }
    };
    markAuthWelcomeSeen();
  }, []);

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with Logo */}
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={80} />
        </View>
        <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
          Welcome! Let&apos;s set up your journey 😊
        </Text>
        <Text
          style={[styles.welcomeSubtitle, { color: theme.colors.subtitle }]}
        >
          Transform your daily habits into meaningful progress
        </Text>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={styles.buttonsContainer}
        entering={FadeInDown.delay(400).springify()}
      >
        {/* Sign Up Button */}
        <Animated.View entering={SlideInRight.delay(600).springify()}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.ctaPrimary },
            ]}
            onPress={handleSignup}
            activeOpacity={0.8}
          >
            <UserPlus size={24} color="#ffffff" style={styles.buttonIcon} />
            <View>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Text style={styles.primaryButtonSubtext}>
                Create your account
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Button */}
        <Animated.View entering={SlideInRight.delay(700).springify()}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <LogIn
              size={24}
              color={theme.colors.ctaPrimary}
              style={styles.buttonIcon}
            />
            <View>
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.colors.text },
                ]}
              >
                Welcome Back
              </Text>
              <Text
                style={[
                  styles.secondaryButtonSubtext,
                  { color: theme.colors.subtitle },
                ]}
              >
                Sign in to your account
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={styles.footer}
        entering={FadeInUp.delay(1000).springify()}
      >
        <Text style={[styles.footerText, { color: theme.colors.subtitle }]}>
          Your privacy matters. We&apos;ll never share your data.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  welcomeSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 16,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  secondaryButtonSubtext: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
