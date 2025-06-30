import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { showAlert } from '../../utils/showAlert';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  User,
  Mail,
  CreditCard as Edit,
  LogOut,
  Save,
  X,
  Moon,
  Sun,
  Bell,
  BellOff,
  Settings,
  Shield,
  CircleHelp as HelpCircle,
  Star,
  Info,
  Database,
  Trash2,
  Download,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import { profileApi, ProfileApiError } from '@/src/api/profile';
import { storage } from '@/src/utils/storage';
import { useToast } from '@/components/ui/Toast';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  // Remove unused needsProfileCreation from destructuring
  const {
    profile,
    loading: profileLoading,
    refreshProfile,
    needsProfileCreation,
    updateProfile,
    validationErrors,
    clearError,
  } = useProfile();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // Notification settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setEditFirstName(profile.firstName || '');
      setEditLastName(profile.lastName || '');
      setEditUsername(profile.username || '');
    }
  }, [profile]);

  // Load settings on component mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSave = async () => {
    if (!editFirstName.trim()) {
      showAlert('Error', 'Please enter your first name');
      return;
    }
    if (!editLastName.trim()) {
      showAlert('Error', 'Please enter your last name');
      return;
    }
    if (!editUsername.trim()) {
      showAlert('Error', 'Please enter a username');
      return;
    }
    try {
      await updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        username: editUsername.trim(),
      });
      setIsEditing(false);
      showAlert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditFirstName(profile.firstName || '');
      setEditLastName(profile.lastName || '');
      setEditUsername(profile.username || '');
    }
    clearError();
    setIsEditing(false);
  };

  // Show loading state while profile is loading
  if (profileLoading && !profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.subtitle }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show profile creation needed state
  if (needsProfileCreation || !profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.subtitle }]}>
            Setting up your profile...
          </Text>
          <TouchableOpacity
            onPress={refreshProfile}
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.ctaPrimary },
            ]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };
  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          setNotificationsEnabled(true);
          // Save notification preference
          await storage.setItem('appSettings', { notificationsEnabled: true });

          showAlert('Success', 'Notifications enabled successfully!');
        } else {
          showAlert(
            'Permission Required',
            'Please enable notifications in your device/browser settings to receive reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Settings',
                onPress: () => Linking.openSettings && Linking.openSettings(),
              },
            ]
          );
        }
      } else {
        setNotificationsEnabled(false);
        // Save notification preference
        await storage.setItem('appSettings', { notificationsEnabled: false });

        showAlert(
          'Notifications Disabled',
          'You can re-enable notifications anytime in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showAlert('Error', 'Failed to update notification settings');
    }
  };
  const handleClearCache = async () => {
    showAlert(
      'Clear Cache',
      'This will clear temporary data and may improve app performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear React Query cache
              queryClient.clear();

              // Clear stored app settings (except essential ones)
              const essentialSettings = await storage.getItem<any>(
                'appSettings'
              );
              if (essentialSettings) {
                const { notificationsEnabled, ...otherSettings } =
                  essentialSettings;
                await storage.removeItem('appSettings');
                await storage.setItem('appSettings', { notificationsEnabled });
              }

              // Clear any other cached data
              await storage.removeItem('tempData');
              await storage.removeItem('cachedQuests');
              await storage.removeItem('userPreferences');

              if (Platform.OS === 'web') {
                showToast({
                  type: 'success',
                  title: 'Success',
                  message: 'Cache cleared successfully!',
                  duration: 3000,
                });
              } else {
                showAlert('Success', 'Cache cleared successfully!');
              }
            } catch (error) {
              console.error('Error clearing cache:', error);

              if (Platform.OS === 'web') {
                showToast({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to clear cache. Please try again.',
                  duration: 3000,
                });
              } else {
                showAlert('Error', 'Failed to clear cache. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Feature Coming Soon',
              'Account deletion will be available in a future update.'
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    showAlert(
      'Feature Coming Soon',
      'Data export will be available in a future update.'
    );
  };

  const handleRateApp = () => {
    showAlert('Rate Zik', 'Would you like to rate our app in the store?', [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Rate App',
        onPress: () => {
          showAlert('Thank You!', 'Redirecting to app store...');
        },
      },
    ]);
  };
  const handleSupport = () => {
    showAlert('Help & Support', 'How can we help you?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Visit Website',
        onPress: () => Linking.openURL('https://dynofx.com/about'),
      },
      {
        text: 'Contact Us',
        onPress: () => Linking.openURL('https://dynofx.com/contact'),
      },
    ]);
  };

  const handleSettings = () => {
    router.push('/(tabs)/profile' as any); // Navigate to dedicated settings screen later

    if (Platform.OS === 'web') {
      showToast({
        type: 'info',
        title: 'Settings',
        message: 'Advanced settings coming soon!',
        duration: 3000,
      });
    } else {
      showAlert('Settings', 'Advanced settings coming soon!');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Profile
        </Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Modern Profile Card */}
        <View
          style={[styles.profileCard, { backgroundColor: theme.colors.card }]}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.ctaPrimary },
                ]}
              >
                <Text style={styles.avatarText}>
                  {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              {!isEditing && (
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: theme.colors.ctaPrimary },
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <Edit size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Profile Info Section */}
          <View style={styles.profileDetails}>
            {/* Name */}
            <View style={styles.profileField}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <Text
                    style={[styles.editLabel, { color: theme.colors.subtitle }]}
                  >
                    First Name
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.text,
                      },
                    ]}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor={theme.colors.subtitle}
                    autoCapitalize="words"
                  />
                  <Text
                    style={[styles.editLabel, { color: theme.colors.subtitle }]}
                  >
                    Last Name
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.text,
                      },
                    ]}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Enter your last name"
                    placeholderTextColor={theme.colors.subtitle}
                    autoCapitalize="words"
                  />
                </View>
              ) : (
                <View style={styles.infoContainer}>
                  <Text
                    style={[styles.profileName, { color: theme.colors.text }]}
                  >
                    {profile?.firstName || ''} {profile?.lastName || ''}
                  </Text>
                </View>
              )}
            </View>
            {/* Username */}
            <View style={styles.profileField}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <Text
                    style={[styles.editLabel, { color: theme.colors.subtitle }]}
                  >
                    Username
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.inputBorder,
                        color: theme.colors.text,
                      },
                    ]}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={theme.colors.subtitle}
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <View style={styles.infoContainer}>
                  <Text
                    style={[
                      styles.profileUsername,
                      { color: theme.colors.ctaPrimary },
                    ]}
                  >
                    @{profile?.username || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.profileField}>
              <View style={styles.infoContainer}>
                <View style={styles.emailContainer}>
                  <Mail size={16} color={theme.colors.subtitle} />
                  <Text
                    style={[
                      styles.profileEmail,
                      { color: theme.colors.subtitle },
                    ]}
                  >
                    {profile?.email || 'Not set'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Edit Actions */}
            {isEditing && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={handleCancel}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.colors.ctaPrimary },
                  ]}
                  onPress={handleSave}
                  disabled={profileLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {profileLoading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {/* Notification Settings Card */}
        <View
          style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.settingsHeader}>
            <Bell size={24} color={theme.colors.ctaPrimary} />
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
              Notifications
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {notificationsEnabled ? (
                <Bell size={20} color={theme.colors.success} />
              ) : (
                <BellOff size={20} color={theme.colors.subtitle} />
              )}
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Push Notifications
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  {notificationsEnabled
                    ? 'Receive app notifications'
                    : 'Notifications disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.ctaPrimary + '40',
              }}
              thumbColor={
                notificationsEnabled
                  ? theme.colors.ctaPrimary
                  : theme.colors.subtitle
              }
            />
          </View>
        </View>
        {/* App Preferences Card */}
        <View
          style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.settingsHeader}>
            <Settings size={24} color={theme.colors.ctaPrimary} />
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
              Preferences
            </Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Sun size={20} color={theme.colors.primary} />
              ) : (
                <Moon size={20} color={theme.colors.primary} />
              )}
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Theme
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSettings}>
            <View style={styles.settingLeft}>
              <Settings size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Advanced Settings
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Detailed preferences & privacy
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>
        {/* Privacy & Security Card */}
        <View
          style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.settingsHeader}>
            <Shield size={24} color={theme.colors.ctaPrimary} />
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
              Privacy & Security
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <View style={styles.settingLeft}>
              <Download size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Export Data
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Download your personal data
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <Database size={20} color={theme.colors.warning} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Clear Cache
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Free up storage space
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={theme.colors.error} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.error }]}
                >
                  Delete Account
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Permanently delete your account
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>
        {/* Support & About Card */}
        <View
          style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.settingsHeader}>
            <HelpCircle size={24} color={theme.colors.ctaPrimary} />
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
              Support & About
            </Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleRateApp}>
            <View style={styles.settingLeft}>
              <Star size={20} color={theme.colors.secondary} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Rate Zik
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Help us improve
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  Help & Support
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  FAQ and contact us
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() =>
              showAlert(
                'About Zik',
                'Version 1.0.0\n\nZik is your personal wellness companion, helping you achieve your goals through mindful practices and AI-powered guidance.'
              )
            }
          >
            <View style={styles.settingLeft}>
              <Info size={20} color={theme.colors.accent} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  About
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  Version 1.0.0
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>
        {/* Logout Button */}
        <View
          style={[styles.logoutCard, { backgroundColor: theme.colors.card }]}
        >
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.colors.error + '20',
                borderColor: theme.colors.error + '40',
              },
            ]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={theme.colors.error} />
            <Text
              style={[styles.logoutButtonText, { color: theme.colors.error }]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  profileCard: {
    borderRadius: 24,
    padding: 0,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  profileDetails: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileField: {
    marginBottom: 20,
  },
  infoContainer: {
    alignItems: 'center',
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  profileUsername: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  profileEmail: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  editContainer: {
    gap: 8,
  },
  editLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginLeft: 4,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  settingsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  logoutCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
