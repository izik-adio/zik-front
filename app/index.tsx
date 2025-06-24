import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
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

      // Check if user has completed initial setup
      const hasOnboarded = await storage.getItem('hasOnboarded');
      const hasSeenAuthWelcome = await storage.getItem('hasSeenAuthWelcome');

      // First time user - show auth welcome first
      if (hasSeenAuthWelcome !== 'true') {
        setShowAuthWelcome(true);
        return;
      }

      // User has seen auth welcome, check if they completed onboarding
      if (hasOnboarded !== 'true') {
        router.replace('/onboarding');
        return;
      }

      // User completed everything, check auth status
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        // Return to auth welcome for login/signup
        setShowAuthWelcome(true);
      }
    } catch (error) {
      console.error('Error in app flow:', error);
      setShowAuthWelcome(true);
      await ExpoSplashScreen.hideAsync();
    }
  }, [router, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && isAppReady) {
      checkAppFlow();
    }
  }, [isLoading, isAppReady, checkAppFlow]);

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
