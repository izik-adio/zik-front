import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/src/context/AuthContext';
import { QueryProvider } from '@/src/context/QueryProvider';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ProfileProvider } from '@/src/context/ProfileContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Analytics } from '@/components/Analytics';
import { DesktopHandler } from '@/components/ui/DesktopHandler';
import { ToastContainer } from '@/components/ui/Toast';
import { AlertProvider } from '../components/ui/AlertProvider';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Don't hide splash screen here - let the App component handle it
    // This ensures our custom splash screen shows properly
    if (fontsLoaded || fontError) {
      // Fonts are ready, but keep splash screen visible
      // The App component will handle hiding it after showing custom splash
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <ProfileProvider>
            <AlertProvider>
              <DesktopHandler>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
                <Analytics />
                <ToastContainer />
              </DesktopHandler>
            </AlertProvider>
          </ProfileProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
