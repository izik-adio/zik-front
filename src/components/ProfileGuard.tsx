import React, { useEffect, useState } from 'react';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useRouter } from 'expo-router';
import { createAutoProfile, ProfileApiError } from '../api/profile';
import { storage } from '../utils/storage';
import { UserProfile } from '../types/api';
import { triggerGlobalLogout } from '../utils/authUtils';

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
        setProfileCreated,
        setNeedsProfileCreation
    } = useProfile();
    const router = useRouter();
    const [creatingProfile, setCreatingProfile] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const hasAttemptedAutoProfileCreation = useRef(false);
    const MAX_RETRIES = 2;

    /**
     * Auto-create profile for new users to reduce friction
     */
    const handleAutoProfileCreation = async () => {
        if (!user?.email) {
            console.error('No user email available for profile creation');
            await triggerGlobalLogout();
            return;
        }

        setCreatingProfile(true);
        try {
            // Try to get the stored signup name first, then fall back to user data
            const storedName = await storage.getItem<string>('signupName');
            const fullName = storedName || user.userName || user.email.split('@')[0];

            console.log('🔄 Auto-creating profile for:', user.email, 'with name:', fullName);

            // Auto-create profile with smart defaults
            const newProfile = await createAutoProfile(fullName, user.email);

            // Clean up stored name
            await storage.removeItem('signupName');

            // Update context with the new profile
            setProfileCreated(newProfile);

            // Reset the attempt flag on successful creation
            hasAttemptedAutoProfileCreation.current = false;

            console.log('✅ Profile auto-created successfully:', newProfile.userId);

        } catch (error) {
            console.error('Auto profile creation failed:', error);

            // Clear any cached state that might be causing issues
            await storage.removeItem('signupName');

            // Check if it's a network error
            if (error instanceof Error && error.message.includes('connect')) {
                // Network issue - create a temporary offline profile
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

                // Reset the attempt flag even for temporary profiles
                hasAttemptedAutoProfileCreation.current = false;

                Alert.alert(
                    'Offline Mode',
                    'Unable to connect to server. You can still use the app with basic features. Your data will sync when connection is restored.',
                    [{ text: 'OK' }]
                );
            } else {
                // Other error - show alert and redirect to auth
                Alert.alert(
                    'Profile Creation Failed',
                    'There was an error creating your profile. Please try logging in again.',
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

    // Debug function to log the current state
    const logState = () => {
        console.log('ProfileGuard State:', {
            isAuthenticated, profileLoading, needsProfileCreation, profile, 
            onboardingCompleted, creatingProfile, retryCount
        });
    };

    // Split effects to handle different concerns
    useEffect(() => {
        // Only handle authentication state
        if (!authLoading && !isAuthenticated) {
            console.log('User not authenticated, redirecting to login');
            router.replace('/auth/login');
        }
        logState();
    }, [authLoading, isAuthenticated, router]);
    
    useEffect(() => {
        // Only handle profile fetching
        if (!authLoading && isAuthenticated && user && !profile && !profileLoading && !needsProfileCreation && !creatingProfile) {
            console.log('User authenticated but no profile, fetching...');
            fetchProfile();
        }
        logState();
    }, [authLoading, isAuthenticated, user, profile, profileLoading, needsProfileCreation, fetchProfile, creatingProfile]);

    useEffect(() => {
        // Only handle profile creation and onboarding
        if (!authLoading && !profileLoading && isAuthenticated) {
            if (needsProfileCreation && user && !creatingProfile && !hasAttemptedAutoProfileCreation.current) {
                console.log('Profile creation needed, starting auto-creation');
                hasAttemptedAutoProfileCreation.current = true;
                handleAutoProfileCreation();
            } else if (profile && !onboardingCompleted) {
                console.log('Profile exists but onboarding incomplete, redirecting to onboarding');
                router.replace('/onboarding');
            }
        }
        logState();
    }, [authLoading, profileLoading, isAuthenticated, needsProfileCreation, profile, onboardingCompleted, user, creatingProfile]);
    
    // Add retry mechanism for profile fetching
    useEffect(() => {
        // If we're authenticated but profile fetch failed, retry a few times
        if (!authLoading && isAuthenticated && user && !profile && !profileLoading && !needsProfileCreation && !creatingProfile && retryCount < MAX_RETRIES) {
            const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            logState();
            console.log(`Retrying profile fetch (attempt ${retryCount + 1}/${MAX_RETRIES}) in ${retryDelay}ms`);
            
            const timer = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                fetchProfile();
            }, retryDelay);
            
            return () => clearTimeout(timer);
        }
    }, [authLoading, isAuthenticated, user, profile, profileLoading, needsProfileCreation, creatingProfile, retryCount, fetchProfile]);
    
    // Add effect to handle max retries exceeded
    useEffect(() => {
        if (retryCount >= MAX_RETRIES && !profile && isAuthenticated && !profileLoading && !creatingProfile) {
            console.log('Max profile fetch retries exceeded, forcing profile creation');
            // After max retries, force profile creation
            if (user) {
                // Reset the attempt flag before forcing profile creation
                hasAttemptedAutoProfileCreation.current = false;
                setNeedsProfileCreation(true);
            } else {
                router.replace('/auth/login');
            }
        }
    }, [retryCount, profile, isAuthenticated, profileLoading, creatingProfile, user, router, setNeedsProfileCreation]);

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
