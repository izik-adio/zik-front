import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useRouter } from 'expo-router';
import { createAutoProfile } from '../api/profile';
import { storage } from '../utils/storage';

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
        fetchProfile
    } = useProfile();
    const router = useRouter();
    const [creatingProfile, setCreatingProfile] = useState(false);

    /**
     * Auto-create profile for new users to reduce friction
     */
    const handleAutoProfileCreation = async () => {
        if (!user?.email) return;

        setCreatingProfile(true);
        try {
            // Try to get the stored signup name first, then fall back to user data
            const storedName = await storage.getItem<string>('signupName');
            const fullName = storedName || user.userName || user.email.split('@')[0];

            // Auto-create profile with smart defaults
            await createAutoProfile(fullName, user.email);

            // Clean up stored name
            await storage.removeItem('signupName');

            // Refresh profile data
            await fetchProfile();

        } catch (error) {
            console.error('Auto profile creation failed:', error);
            // If auto-creation fails, show error and redirect to auth
            // This should be rare, but provides a fallback
            router.replace('/auth/login');
        } finally {
            setCreatingProfile(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            // User is authenticated, ensure profile is loaded
            if (!profile && !profileLoading && !needsProfileCreation) {
                fetchProfile();
            }
        }
    }, [authLoading, isAuthenticated, user, profile, profileLoading, needsProfileCreation, fetchProfile]);

    useEffect(() => {
        if (!authLoading && !profileLoading) {
            if (!isAuthenticated) {
                // Not authenticated, redirect to auth
                router.replace('/auth/login');
                return;
            }

            if (needsProfileCreation && user) {
                // Profile doesn't exist, auto-create one for better UX
                handleAutoProfileCreation();
                return;
            }

            if (profile && !onboardingCompleted) {
                // Profile exists but onboarding not complete
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
