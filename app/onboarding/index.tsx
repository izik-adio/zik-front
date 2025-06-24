import { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/src/utils/storage';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { X } from 'lucide-react-native';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { GoalsSelectionScreen } from '@/components/onboarding/GoalsSelectionScreen';
import { PermissionsScreen } from '@/components/onboarding/PermissionsScreen';

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    selectedGoals: [] as string[],
  });
  const router = useRouter();
  const { theme } = useTheme();
  const steps = [
    { component: WelcomeScreen, key: 'welcome' },
    { component: GoalsSelectionScreen, key: 'goals' },
    { component: PermissionsScreen, key: 'permissions' },
  ];
  const handleNext = async (data?: any) => {
    if (data) {
      // Handle goals selection data
      const cleanData: any = {};

      if (Array.isArray(data) && currentStep === 1) {
        // Goals selection returns an array
        cleanData.selectedGoals = data;
      } else if (data.selectedGoals && Array.isArray(data.selectedGoals)) {
        cleanData.selectedGoals = data.selectedGoals;
      }

      const updatedUserData = { ...userData, ...cleanData };
      setUserData(updatedUserData);

      // Store selected goals
      if (cleanData.selectedGoals) {
        try {
          await storage.setItem('selectedGoals', cleanData.selectedGoals);
        } catch (error) {
          console.error('Error storing selected goals:', error);
        }
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete - ensure we complete it properly
      await completeOnboarding();
    }
  };
  const completeOnboarding = async () => {
    try {
      // Mark onboarding as completed
      await storage.setItem('hasOnboarded', 'true');

      // Store any selected goals
      if (userData.selectedGoals && userData.selectedGoals.length > 0) {
        await storage.setItem('selectedGoals', userData.selectedGoals);
      }

      // Check if user is authenticated
      const hasSeenAuthWelcome = await storage.getItem('hasSeenAuthWelcome');

      if (hasSeenAuthWelcome === 'true') {
        // User came from auth welcome, check if they're authenticated
        // If not authenticated, go to login; if authenticated, go to main app
        setTimeout(() => {
          router.replace('/auth/login');
        }, 100);
      } else {
        // First time flow - go to auth welcome
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback redirect
      router.replace('/auth/login');
    }
  };
  const handleSkip = async () => {
    // Allow skipping goals selection and other optional steps
    if (currentStep === 1) {
      // Goals selection - skip to next step
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 0) {
      // Welcome screen - skip entire onboarding
      handleSkipOnboarding();
    } else {
      // Other steps - proceed to next
      handleNext();
    }
  };
  const handleSkipOnboarding = async () => {
    try {
      // Mark onboarding as completed even though skipped
      await storage.setItem('hasOnboarded', 'true');
      // Set default values for skipped steps
      await storage.setItem('onboardingSkipped', 'true');

      // Force redirect with small delay to ensure storage completes
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Fallback redirect even if storage fails
      router.replace('/auth/login');
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with Skip Button */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: theme.colors.ctaPrimary,
                },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipOnboarding}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.skipButtonText, { color: theme.colors.subtitle }]}
          >
            Skip
          </Text>
          <X size={18} color={theme.colors.subtitle} />
        </TouchableOpacity>
      </View>

      <Animated.View
        key={currentStep}
        entering={SlideInRight.duration(300)}
        exiting={SlideOutLeft.duration(300)}
        style={styles.stepContainer}
      >
        <CurrentStepComponent onNext={handleNext} onSkip={handleSkip} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  skipButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  stepContainer: {
    flex: 1,
  },
});
