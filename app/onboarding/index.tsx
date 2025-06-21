import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '@/src/utils/storage';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { IntroScreen } from '@/components/onboarding/IntroScreen';
import { ProfileSetupScreen } from '@/components/onboarding/ProfileSetupScreen';
import { FirstQuestScreen } from '@/components/onboarding/FirstQuestScreen';
import { PermissionsScreen } from '@/components/onboarding/PermissionsScreen';

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    firstQuest: '',
  });
  const router = useRouter();

  const steps = [
    { component: WelcomeScreen, key: 'welcome' },
    { component: IntroScreen, key: 'intro' },
    { component: ProfileSetupScreen, key: 'profile' },
    { component: FirstQuestScreen, key: 'quest' },
    { component: PermissionsScreen, key: 'permissions' },
  ];

  const handleNext = async (data?: any) => {
    if (data) {
      setUserData(prev => ({ ...prev, ...data }));
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await storage.setItem('hasOnboarded', 'true');
      await storage.setItem('onboardingData', userData);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <Animated.View
        key={currentStep}
        entering={SlideInRight.springify()}
        exiting={SlideOutLeft.springify()}
        style={styles.stepContainer}
      >
        <CurrentStepComponent
          onNext={handleNext}
          userData={userData}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#14b8a6',
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
  },
});
