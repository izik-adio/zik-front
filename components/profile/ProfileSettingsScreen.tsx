import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { profileApi, ProfileApiError } from '../../src/api/profile';
import { UpdateProfileRequest, UserPreferences } from '../../src/types/api';
import { useProfile } from '../../src/context/ProfileContext';
import { showAlert } from '../../utils/showAlert';

const ProfileSettingsScreen: React.FC = () => {
    const router = useRouter();
    const {
        profile,
        loading: profileLoading,
        updateProfile,
        refreshProfile,
        validationErrors,
        clearError
    } = useProfile();

    const [formData, setFormData] = useState<UpdateProfileRequest>({
        username: '',
        firstName: '',
        lastName: '',
        displayName: '',
    });

    const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Use validation errors from context
    const errors = validationErrors;

    // Initialize form data when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username,
                firstName: profile.firstName,
                lastName: profile.lastName,
                displayName: profile.displayName || '',
            });
            setPreferences(profile.preferences);
        }
    }, [profile]);

    // Track changes
    useEffect(() => {
        if (!profile) return;

        const dataChanged =
            formData.username !== profile.username ||
            formData.firstName !== profile.firstName ||
            formData.lastName !== profile.lastName ||
            formData.displayName !== (profile.displayName || '');

        const prefsChanged = JSON.stringify(preferences) !== JSON.stringify(profile.preferences);

        setHasChanges(dataChanged || prefsChanged);
    }, [formData, preferences, profile]);

    const validateForm = (): boolean => {
        // We'll rely on the context's validation when updateProfile is called
        return true;
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        clearError();

        try {
            // Filter out unchanged fields
            const changedData: UpdateProfileRequest = {};

            if (formData.username !== profile?.username) {
                changedData.username = formData.username;
            }
            if (formData.firstName !== profile?.firstName) {
                changedData.firstName = formData.firstName;
            }
            if (formData.lastName !== profile?.lastName) {
                changedData.lastName = formData.lastName;
            }
            if (formData.displayName !== (profile?.displayName || '')) {
                changedData.displayName = formData.displayName;
            }

            await updateProfile(changedData);
            await refreshProfile();
            showAlert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            showAlert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setLoading(true);

        try {
            await profileApi.updatePreferences(preferences);
            await refreshProfile(); // Refresh to get updated profile
            showAlert('Success', 'Preferences updated successfully');
        } catch (error) {
            showAlert('Error', 'Failed to update preferences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field: keyof UpdateProfileRequest, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field when user types
        if (errors[field]) {
            clearError();
        }
    };

    const updateNotificationPreference = (key: string, value: boolean) => {
        setPreferences(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications!,
                [key]: value,
            },
        }));
    };

    if (profileLoading || !profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profile Settings</Text>
                    <Text style={styles.subtitle}>
                        Manage your profile information and preferences
                    </Text>
                </View>

                {/* Profile Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>

                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={[styles.input, errors.firstName && styles.inputError]}
                            value={formData.firstName}
                            onChangeText={(value) => updateFormData('firstName', value)}
                            placeholder="First name"
                            autoCapitalize="words"
                            maxLength={50}
                        />
                        {errors.firstName ? (
                            <Text style={styles.errorText}>{errors.firstName}</Text>
                        ) : null}
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={[styles.input, errors.lastName && styles.inputError]}
                            value={formData.lastName}
                            onChangeText={(value) => updateFormData('lastName', value)}
                            placeholder="Last name"
                            autoCapitalize="words"
                            maxLength={50}
                        />
                        {errors.lastName ? (
                            <Text style={styles.errorText}>{errors.lastName}</Text>
                        ) : null}
                    </View>

                    {/* Username */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[styles.input, errors.username && styles.inputError]}
                            value={formData.username}
                            onChangeText={(value) => updateFormData('username', value)}
                            placeholder="Username"
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={30}
                        />
                        {errors.username ? (
                            <Text style={styles.errorText}>{errors.username}</Text>
                        ) : null}
                    </View>

                    {/* Display Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Display Name</Text>
                        <TextInput
                            style={[styles.input, errors.displayName && styles.inputError]}
                            value={formData.displayName}
                            onChangeText={(value) => updateFormData('displayName', value)}
                            placeholder="Display name (optional)"
                            autoCapitalize="words"
                            maxLength={100}
                        />
                        {errors.displayName ? (
                            <Text style={styles.errorText}>{errors.displayName}</Text>
                        ) : null}
                    </View>

                    {/* Email (read-only) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputReadonly]}
                            value={profile.email}
                            editable={false}
                        />
                        <Text style={styles.helperText}>
                            Email cannot be changed here. Contact support if needed.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, (!hasChanges || loading) && styles.saveButtonDisabled]}
                        onPress={handleSaveProfile}
                        disabled={!hasChanges || loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save Profile'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    {/* Theme Selection */}
                    <View style={styles.preferenceGroup}>
                        <Text style={styles.preferenceLabel}>Theme</Text>
                        <View style={styles.themeOptions}>
                            {(['light', 'dark', 'system'] as const).map((theme) => (
                                <TouchableOpacity
                                    key={theme}
                                    style={[
                                        styles.themeOption,
                                        preferences.theme === theme && styles.themeOptionSelected,
                                    ]}
                                    onPress={() => setPreferences(prev => ({ ...prev, theme }))}
                                >
                                    <Text
                                        style={[
                                            styles.themeOptionText,
                                            preferences.theme === theme && styles.themeOptionTextSelected,
                                        ]}
                                    >
                                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Notification Preferences */}
                    <View style={styles.preferenceGroup}>
                        <Text style={styles.preferenceLabel}>Notifications</Text>

                        {Object.entries(preferences.notifications || {}).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.notificationOption}
                                onPress={() => updateNotificationPreference(key, !value)}
                            >
                                <Text style={styles.notificationLabel}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Text>
                                <View style={[styles.toggle, value && styles.toggleActive]}>
                                    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Privacy Settings */}
                    <View style={styles.preferenceGroup}>
                        <Text style={styles.preferenceLabel}>Privacy</Text>

                        {Object.entries(preferences.privacySettings || {}).map(([key, value]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.notificationOption}
                                onPress={() => {
                                    setPreferences(prev => ({
                                        ...prev,
                                        privacySettings: {
                                            ...prev.privacySettings!,
                                            [key]: !value,
                                        },
                                    }));
                                }}
                            >
                                <Text style={styles.notificationLabel}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Text>
                                <View style={[styles.toggle, value && styles.toggleActive]}>
                                    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSavePreferences}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Saving...' : 'Save Preferences'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 30,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#e74c3c',
    },
    inputReadonly: {
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        marginTop: 4,
    },
    helperText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    preferenceGroup: {
        marginBottom: 20,
    },
    preferenceLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    themeOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    themeOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    themeOptionText: {
        fontSize: 14,
        color: '#666',
    },
    themeOptionTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    notificationOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    notificationLabel: {
        fontSize: 14,
        color: '#1a1a1a',
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ddd',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#007AFF',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{ translateX: 20 }],
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileSettingsScreen;
