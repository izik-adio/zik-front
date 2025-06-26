import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  User,
  Mail,
  CreditCard as Edit3,
  LogOut,
  Save,
  X,
  Moon,
  Sun,
  Bell,
  BellOff,
  Settings,
  Shield,
  HelpCircle,
  Star,
  Info,
  Database,
  Trash2,
  Download,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { profileApi } from '@/src/api/profile';
import { storage } from '@/src/utils/storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.userName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  // Notification settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
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

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: !!user,
    initialData: user
      ? {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  const handleSave = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        userName: editName.trim(),
        email: editEmail.trim(),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditName(user?.userName || '');
    setEditEmail(user?.email || '');
    setIsEditing(false);
  };
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
          Alert.alert('Success', 'Notifications enabled successfully!');
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        setNotificationsEnabled(false);
        // Save notification preference
        await storage.setItem('appSettings', { notificationsEnabled: false });
        Alert.alert(
          'Notifications Disabled',
          'You can re-enable notifications anytime in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };
  const handleClearCache = async () => {
    Alert.alert(
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

              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete account logic here
            Alert.alert(
              'Feature Coming Soon',
              'Account deletion will be available in a future update.'
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Feature Coming Soon',
      'Data export will be available in a future update.'
    );
  };

  const handleRateApp = () => {
    Alert.alert('Rate Zik', 'Would you like to rate our app in the store?', [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Rate App',
        onPress: () => {
          // Open app store rating
          Alert.alert('Thank You!', 'Redirecting to app store...');
        },
      },
    ]);
  };
  const handleSupport = () => {
    Alert.alert('Help & Support', 'How can we help you?', [
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
  if (isLoading) {
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
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit3 size={20} color={theme.colors.ctaPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <X size={20} color={theme.colors.error} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              <Save size={20} color={theme.colors.ctaPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Information Card */}
        <View
          style={[styles.profileCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.ctaPrimary + '20' },
              ]}
            >
              <User size={48} color={theme.colors.ctaPrimary} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Name
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.text,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.subtitle}
                  autoCapitalize="words"
                />
              ) : (
                <View
                  style={[
                    styles.fieldValue,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <User size={20} color={theme.colors.subtitle} />
                  <Text
                    style={[styles.fieldText, { color: theme.colors.text }]}
                  >
                    {profile?.userName || 'Not set'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                Email
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      color: theme.colors.text,
                    },
                  ]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.subtitle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <View
                  style={[
                    styles.fieldValue,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Mail size={20} color={theme.colors.subtitle} />
                  <Text
                    style={[styles.fieldText, { color: theme.colors.text }]}
                  >
                    {profile?.email || 'Not set'}
                  </Text>
                </View>
              )}
            </View>
            {profile?.createdAt && (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                  Member Since
                </Text>
                <View
                  style={[
                    styles.fieldValue,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Calendar size={20} color={theme.colors.subtitle} />
                  <Text
                    style={[styles.fieldText, { color: theme.colors.text }]}
                  >
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </Text>
                </View>
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
              Alert.alert(
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
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
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
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fieldText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
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
});
