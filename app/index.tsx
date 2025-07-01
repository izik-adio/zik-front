import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import { storage } from '@/src/utils/storage';
import { SplashScreen } from '@/components/onboarding/SplashScreen';
import { AuthWelcomeScreen } from '@/components/onboarding/AuthWelcomeScreen';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { GoalsSelectionScreen } from '@/components/onboarding/GoalsSelectionScreen';
import { profileApi } from '@/src/api/profile';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Keep splash screen visible initially
ExpoSplashScreen.preventAutoHideAsync();

export default function App() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const {
    profile,
    onboardingCompleted,
    refreshProfile,
    loading: profileLoading,
  } = useProfile();
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showAuthWelcome, setShowAuthWelcome] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<
    string | null
  >(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setIsAppReady(true);
  }, []);

  const checkAppFlow = useCallback(async () => {
    try {
      // Hide expo splash screen
      await ExpoSplashScreen.hideAsync();

      // If not authenticated, show auth welcome
      if (!isAuthenticated) {
        setShowAuthWelcome(true);
        setCurrentOnboardingStep(null);
        return;
      }

      // User is authenticated, check if profile is still loading
      if (profileLoading) {
        // Profile is still loading, wait for it
        return;
      }

      // If we don't have a profile after loading is complete, there's an issue
      if (!profile) {
        console.error('No profile found after authentication');
        setShowAuthWelcome(true);
        setCurrentOnboardingStep(null);
        return;
      }

      // Check onboarding status
      if (!onboardingCompleted) {
        // Start onboarding flow
        setCurrentOnboardingStep('welcome');
        setShowAuthWelcome(false);
      } else {
        // User completed onboarding, go to main app
        setCurrentOnboardingStep(null);
        setShowAuthWelcome(false);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error in app flow:', error);
      setShowAuthWelcome(true);
      setCurrentOnboardingStep(null);
      await ExpoSplashScreen.hideAsync();
    }
  }, [router, isAuthenticated, onboardingCompleted, profile, profileLoading]);

  useEffect(() => {
    if (!isLoading && isAppReady) {
      checkAppFlow();
    }
  }, [
    isLoading,
    isAppReady,
    profile,
    onboardingCompleted,
    profileLoading,
    checkAppFlow,
  ]);

  // Onboarding step handlers
  const handleWelcomeNext = () => {
    setCurrentOnboardingStep('goals');
  };

  const handleGoalsNext = async (goals: string[]) => {
    setSelectedGoals(goals);
    // Store selected goals
    await storage.setItem('selectedGoals', goals);
    // Skip permissions step and complete onboarding directly
    await handleOnboardingComplete();
  };

  const handleGoalsSkip = async () => {
    setSelectedGoals([]);
    await storage.setItem('selectedGoals', []);
    // Skip permissions step and complete onboarding directly
    await handleOnboardingComplete();
  };

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as completed
      await profileApi.completeOnboarding();

      // Refresh profile to get updated onboarding status
      await refreshProfile();

      // Clear onboarding data
      await storage.removeItem('selectedGoals');

      // Navigate to main app
      setCurrentOnboardingStep(null);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate to main app even if API call fails
      setCurrentOnboardingStep(null);
      router.replace('/(tabs)');
    }
  };

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show auth welcome screen
  if (showAuthWelcome) {
    return <AuthWelcomeScreen />;
  }

  // Show onboarding screens
  if (currentOnboardingStep === 'welcome') {
    return <WelcomeScreen onNext={handleWelcomeNext} />;
  }

  if (currentOnboardingStep === 'goals') {
    return (
      <GoalsSelectionScreen onNext={handleGoalsNext} onSkip={handleGoalsSkip} />
    );
  }

  // Show loading state while checking auth or profile
  if (isLoading || profileLoading || !isAppReady) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.loading, { color: theme.colors.text }]}>
          {isLoading
            ? 'Authenticating...'
            : profileLoading
            ? 'Loading profile...'
            : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.loading, { color: theme.colors.text }]}>
        Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});
