import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, loading: profileLoading, needsProfileCreation, refreshProfile } = useProfile();
  const { theme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !profileLoading && !profile && !needsProfileCreation) {
      refreshProfile();
    }
  }, [isAuthenticated, user, profile, needsProfileCreation, profileLoading, refreshProfile]);

  useEffect(() => {
    // Mark as initialized when auth and profile states are resolved
    if (!authLoading && isAuthenticated && (!profileLoading || profile || needsProfileCreation)) {
      setIsInitialized(true);
    }
  }, [authLoading, isAuthenticated, profileLoading, profile, needsProfileCreation]);

  if (authLoading || profileLoading || !isInitialized) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading your account...' : 'Setting up your profile...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});