import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import {
  Bell,
  Shield,
  Heart,
  Sparkles,
  CheckCircle,
  Settings,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

interface PermissionsScreenProps {
  onNext: () => void;
}

export function PermissionsScreen({ onNext }: PermissionsScreenProps) {
  const { theme } = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const iconScale = useSharedValue(1);
  useEffect(() => {
    checkNotificationPermission();

    // Gentle pulse animation for the bell icon
    const pulse = () => {
      iconScale.value = withSpring(1.1, { duration: 1000 });
      setTimeout(() => {
        iconScale.value = withSpring(1, { duration: 1000 });
      }, 1000);
    };

    const interval = setInterval(pulse, 3000);
    return () => clearInterval(interval);
  }, [iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));
  const checkNotificationPermission = async () => {
    try {
      // Skip notification permission check on web platform
      if (Platform.OS === 'web') {
        setPermissionStatus('denied'); // Web doesn't support push notifications in the same way
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setPermissionStatus('denied');
    }
  };
  const requestNotificationPermission = async () => {
    try {
      // Handle web platform limitation
      if (Platform.OS === 'web') {
        Alert.alert(
          'Notifications',
          "Web notifications aren't supported in the same way as mobile apps. You can still enjoy all other features of your wellness journey!",
          [{ text: 'Continue', onPress: onNext }]
        );
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status === 'granted') {
        // Set up default notification preferences
        await Notifications.setNotificationCategoryAsync('encouragement', []);
        setTimeout(onNext, 1500); // Brief delay to show success state
      } else {
        // Still proceed but show they can enable later
        setTimeout(onNext, 500);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert(
        'Permission Error',
        'Unable to request notification permission. You can enable this later in Settings.',
        [{ text: 'OK', onPress: onNext }]
      );
    }
  };

  const openSettings = () => {
    Alert.alert(
      'Enable in Settings',
      'You can enable notifications anytime in your device Settings > Notifications > Zik.',
      [
        { text: 'Not Now', onPress: onNext },
        { text: 'OK', onPress: onNext },
      ]
    );
  };
  if (permissionStatus === 'granted') {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Animated.View
          style={styles.successContainer}
          entering={FadeInUp.springify()}
        >
          <View
            style={[
              styles.successIconContainer,
              { backgroundColor: theme.colors.success + '20' },
            ]}
          >
            <CheckCircle size={64} color={theme.colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Perfect! You&apos;re all set 🎉
          </Text>
          <Text
            style={[styles.successSubtitle, { color: theme.colors.subtitle }]}
          >
            We&apos;ll send you gentle, encouraging reminders to support your
            journey.
          </Text>

          <Animated.View
            style={styles.successActions}
            entering={FadeInUp.delay(500).springify()}
          >
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: theme.colors.ctaPrimary },
              ]}
              onPress={onNext}
              activeOpacity={0.8}
            >
              <Sparkles size={20} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.continueButtonText}>
                Let&apos;s Begin Your Journey!
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <Bell size={48} color={theme.colors.ctaPrimary} />
        </Animated.View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          May we send friendly reminders?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
          They&apos;re positive nudges, not nagging 💫
        </Text>
      </Animated.View>

      {/* Benefits */}
      <Animated.View
        style={styles.scrollContent}
        entering={FadeInDown.delay(400).springify()}
      >
        <Text style={[styles.description, { color: theme.colors.subtitle }]}>
          Gentle notifications help you build lasting habits through:
        </Text>

        <View style={styles.benefitsList}>
          <Animated.View
            style={styles.benefit}
            entering={SlideInRight.delay(600).springify()}
          >
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: theme.colors.success + '20' },
              ]}
            >
              <Heart size={20} color={theme.colors.success} />
            </View>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Encouraging check-ins
              </Text>
              <Text
                style={[
                  styles.benefitSubtitle,
                  { color: theme.colors.subtitle },
                ]}
              >
                Supportive reminders that celebrate progress
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={styles.benefit}
            entering={SlideInRight.delay(700).springify()}
          >
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: theme.colors.ctaPrimary + '20' },
              ]}
            >
              <Sparkles size={20} color={theme.colors.ctaPrimary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Personalized timing
              </Text>
              <Text
                style={[
                  styles.benefitSubtitle,
                  { color: theme.colors.subtitle },
                ]}
              >
                Smart notifications that respect your schedule
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={styles.benefit}
            entering={SlideInRight.delay(800).springify()}
          >
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Shield size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Complete privacy
              </Text>
              <Text
                style={[
                  styles.benefitSubtitle,
                  { color: theme.colors.subtitle },
                ]}
              >
                Your data stays private and secure
              </Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View
        style={styles.actions}
        entering={FadeInUp.delay(1000).springify()}
      >
        <TouchableOpacity
          style={[
            styles.allowButton,
            { backgroundColor: theme.colors.ctaPrimary },
          ]}
          onPress={requestNotificationPermission}
          activeOpacity={0.8}
        >
          <Bell size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.allowButtonText}>Enable Gentle Reminders</Text>
        </TouchableOpacity>
        <View style={styles.alternativeActions}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
            activeOpacity={0.7}
          >
            <Settings size={16} color={theme.colors.subtitle} />
            <Text
              style={[styles.settingsText, { color: theme.colors.subtitle }]}
            >
              Enable in Settings Later
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: Platform.OS === 'web' ? 'auto' : undefined,
  },
  header: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fef3e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Platform.OS === 'web' ? 20 : 32,
  },
  benefitsList: {
    gap: Platform.OS === 'web' ? 26 : 26,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
    paddingTop: 2,
  },
  benefitTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  benefitSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 20,
  },
  allowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 18,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 12,
  },
  allowButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  alternativeActions: {
    alignItems: 'center',
    gap: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 8,
  },
  settingsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  successSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
});
