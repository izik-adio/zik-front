import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import { storage } from '@/src/utils/storage';
import { SplashScreen } from '@/components/onboarding/SplashScreen';
import { AuthWelcomeScreen } from '@/components/onboarding/AuthWelcomeScreen';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Keep splash screen visible initially
ExpoSplashScreen.preventAutoHideAsync();

export default function App() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { profile, onboardingCompleted, loading: profileLoading } = useProfile();
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showAuthWelcome, setShowAuthWelcome] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

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
        return;
      }

      // User is authenticated, let ProfileGuard handle the rest
      if (profile && !onboardingCompleted) {
        // Profile exists but onboarding not complete
        router.replace('/onboarding');
        return;
      }

      if (profile && onboardingCompleted) {
        // User is fully set up, go to main app
        router.replace('/(tabs)');
        return;
      }

      // If we get here, we're still loading profile data
      // Just wait for the profile context to handle the routing
    } catch (error) {
      console.error('Error in app flow:', error);
      setShowAuthWelcome(true);
      await ExpoSplashScreen.hideAsync();
    }
  }, [router, isAuthenticated, profile, onboardingCompleted]);

  useEffect(() => {
    if (!isLoading && !profileLoading && isAppReady) {
      checkAppFlow();
    }
  }, [isLoading, profileLoading, isAppReady, checkAppFlow]);

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show auth welcome screen
  if (showAuthWelcome) {
    return <AuthWelcomeScreen />;
  }

  // Show loading state while checking auth
  if (isLoading || !isAppReady) {
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
