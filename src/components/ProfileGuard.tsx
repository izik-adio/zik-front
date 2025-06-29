import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useRouter } from 'expo-router';
import { createAutoProfile, ProfileApiError } from '../api/profile';
import { storage } from '../utils/storage';
import { UserProfile } from '../types/api';

interface ProfileGuardProps {
    children: React.ReactNode;
}

/**
 * ProfileGuard Component
 * Ensures user has a profile before accessing the main app
 * Redirects to profile creation if needed
 */
export const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
    const {
        profile,
        loading: profileLoading,
        needsProfileCreation,
        onboardingCompleted,
        fetchProfile,
        setProfileCreated
    } = useProfile();
    const router = useRouter();
    const [creatingProfile, setCreatingProfile] = useState(false);

    /**
     * Auto-create profile for new users to reduce friction
     */
    const handleAutoProfileCreation = async () => {
        if (!user?.email) {
            console.error('No user email available for profile creation');
            router.replace('/auth/login');
            return;
        }

        setCreatingProfile(true);
        try {
            // Try to get the stored signup name first, then fall back to user data
            const storedName = await storage.getItem<string>('signupName');
            const fullName = storedName || user.userName || user.email.split('@')[0];

            console.log('Auto-creating profile for:', user.email, 'with name:', fullName);

            // Auto-create profile with smart defaults
            const newProfile = await createAutoProfile(fullName, user.email);

            // Clean up stored name
            await storage.removeItem('signupName');

            // Update context with the new profile
            setProfileCreated(newProfile);

            console.log('Profile auto-created successfully:', newProfile.userId);

        } catch (error) {
            console.error('Auto profile creation failed:', error);

            // Clear any cached state that might be causing issues
            await storage.removeItem('signupName');

            // Check if it's a network error
            if (error instanceof Error && error.message.includes('connect')) {
                // Network issue - for better UX, create a temporary offline profile
                console.log('Network error during profile creation, creating temporary profile');

                // Create a temporary profile to allow app usage
                const storedName = await storage.getItem<string>('signupName');
                const fullName = storedName || user.userName || user.email.split('@')[0];
                const nameParts = fullName.trim().split(' ');
                const firstName = nameParts[0] || user.email.split('@')[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

                const tempProfile: UserProfile = {
                    userId: 'temp-' + Date.now(),
                    username: user.userName?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') || 'tempuser',
                    email: user.email,
                    firstName,
                    lastName,
                    displayName: fullName || `${firstName} ${lastName}`,
                    preferences: {
                        theme: 'system' as const,
                        notifications: {
                            email: true,
                            push: true,
                            dailyReminders: true,
                            weeklyDigest: false,
                        },
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        language: 'en',
                        questCategories: ['health', 'career', 'personal', 'learning'],
                        privacySettings: {
                            shareProgress: false,
                            publicProfile: false,
                        },
                    },
                    onboardingCompleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                // Set this as the current profile
                setProfileCreated(tempProfile);

                Alert.alert(
                    'Offline Mode',
                    'Unable to connect to server. You can still use the app with basic features. Your data will sync when connection is restored.',
                    [{ text: 'OK' }]
                );
            } else {
                // Other error - show alert and redirect to auth
                Alert.alert(
                    'Setup Required',
                    'We need to set up your profile. Please try signing in again.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/auth/login')
                        }
                    ]
                );
            }
        } finally {
            setCreatingProfile(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            // User is authenticated, ensure profile is loaded
            if (!profile && !profileLoading && !needsProfileCreation && !creatingProfile) {
                console.log('User authenticated but no profile, fetching...');
                fetchProfile();
            }
        }
    }, [authLoading, isAuthenticated, user, profile, profileLoading, needsProfileCreation, fetchProfile, creatingProfile]);

    useEffect(() => {
        if (!authLoading && !profileLoading) {
            if (!isAuthenticated) {
                // Not authenticated, redirect to auth
                console.log('User not authenticated, redirecting to login');
                router.replace('/auth/login');
                return;
            }

            if (needsProfileCreation && user && !creatingProfile) {
                // Profile doesn't exist, auto-create one for better UX
                console.log('Profile creation needed, starting auto-creation');
                handleAutoProfileCreation();
                return;
            }

            if (profile && !onboardingCompleted) {
                // Profile exists but onboarding not complete
                console.log('Profile exists but onboarding incomplete, redirecting to onboarding');
                router.replace('/onboarding');
                return;
            }
        }
    }, [
        authLoading,
        profileLoading,
        isAuthenticated,
        needsProfileCreation,
        profile,
        onboardingCompleted,
        user,
        creatingProfile,
        router
    ]);

    // Show loading state
    if (authLoading || profileLoading || needsProfileCreation || creatingProfile || (profile && !onboardingCompleted)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>
                        {authLoading ? 'Checking authentication...' :
                            profileLoading ? 'Loading profile...' :
                                creatingProfile ? 'Setting up your profile...' :
                                    needsProfileCreation ? 'Preparing your account...' :
                                        'Completing setup...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // User is authenticated and has completed profile/onboarding
    if (isAuthenticated && profile && onboardingCompleted) {
        return <>{children}</>;
    }

    // Fallback loading state
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default ProfileGuard;
