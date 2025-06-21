import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  CreditCard as Edit3,
  LogOut,
  Save,
  X,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { profileApi } from '@/src/api/profile';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.userName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

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
            <Edit3 size={20} color={theme.colors.primary} />
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
              <Save size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.profileCard, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <User size={48} color={theme.colors.primary} />
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
                <Text style={[styles.fieldText, { color: theme.colors.text }]}>
                  {new Date(profile.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.actionsCard,
            { backgroundColor: theme.colors.cardBackground },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: theme.colors.primary + '20',
                borderColor: theme.colors.primary + '40',
              },
            ]}
            onPress={toggleTheme}
          >
            {isDark ? (
              <Sun size={20} color={theme.colors.primary} />
            ) : (
              <Moon size={20} color={theme.colors.primary} />
            )}
            <Text
              style={[styles.themeButtonText, { color: theme.colors.text }]}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>
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
  actionsCard: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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
