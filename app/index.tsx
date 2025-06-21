import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { storage } from '@/src/utils/storage';
import * as SplashScreen from 'expo-splash-screen';

export default function App() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      checkOnboardingStatus();
    }
  }, [isLoading, isAuthenticated]);

  const checkOnboardingStatus = async () => {
    try {
      await SplashScreen.hideAsync();
      if (isAuthenticated) {
        const hasOnboarded = await storage.getItem('hasOnboarded');
        if (hasOnboarded === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        router.replace('/auth/login');
        await SplashScreen.hideAsync();
      }
    } catch (error) {
      router.replace('/auth/login');
      await SplashScreen.hideAsync();
    }
  };

  if (isLoading) {
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
