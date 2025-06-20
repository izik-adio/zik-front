import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

export default function App() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      checkOnboardingStatus();
    }
  }, [isLoading, isAuthenticated]);

  const checkOnboardingStatus = async () => {
    try {
        await SplashScreen.hideAsync();
      if (isAuthenticated) {
        const { storage } = await import('@/src/utils/storage');
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
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.loading}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loading: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748b',
  },
});