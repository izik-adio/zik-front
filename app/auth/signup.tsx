import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import { storage } from '@/src/utils/storage';
import { LogoImage } from '@/components/core/LogoImage';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const { signup, confirmSignup } = useAuth();
  const router = useRouter();
  useEffect(() => {
    // Pre-fill the name from onboarding data
    const loadPreferredName = async () => {
      try {
        const preferredName = await storage.getItem<string>('preferredName');
        if (preferredName && typeof preferredName === 'string') {
          setName(preferredName);
        }
      } catch (error) {
        console.error('Error loading preferred name:', error);
      }
    };

    loadPreferredName();
  }, []);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(email.trim(), password, name.trim());
      if (result.requiresConfirmation) {
        setShowConfirmation(true);
        Alert.alert(
          'Success',
          'Please check your email for a confirmation code'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error.message || 'An error occurred during signup'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignup = async () => {
    if (!confirmationCode.trim()) {
      Alert.alert('Error', 'Please enter the confirmation code');
      return;
    }

    setIsLoading(true);
    try {
      await confirmSignup(email.trim(), confirmationCode.trim());
      // Clear the preferred name after successful signup
      await storage.removeItem('preferredName');
      Alert.alert('Success', 'Account confirmed successfully! Please sign in.');
      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert(
        'Confirmation Failed',
        error.message || 'Invalid confirmation code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Confirm Your Email
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
            We've sent a 6-digit code to {email}. Enter it below to confirm your
            account.
          </Text>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Confirmation Code"
                placeholderTextColor={theme.colors.subtitle}
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.ctaPrimary },
                isLoading && [
                  styles.buttonDisabled,
                  { backgroundColor: theme.colors.border },
                ],
              ]}
              onPress={handleConfirmSignup}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                {isLoading ? 'Confirming...' : 'Confirm Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowConfirmation(false)}
            >
              <Text
                style={[styles.linkText, { color: theme.colors.ctaPrimary }]}
              >
                Back to Signup
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.logo}>
          <LogoImage size={80} style={{ marginBottom: 24 }} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Create Account
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
          Join Zik and start your journey
        </Text>

        <View style={styles.form}>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.inputBorder,
              },
            ]}
          >
            <User
              size={20}
              color={theme.colors.subtitle}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.subtitle}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.inputBorder,
              },
            ]}
          >
            <Mail
              size={20}
              color={theme.colors.subtitle}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.subtitle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.inputBorder,
              },
            ]}
          >
            <Lock
              size={20}
              color={theme.colors.subtitle}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.subtitle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.subtitle} />
              ) : (
                <Eye size={20} color={theme.colors.subtitle} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.ctaPrimary },
              isLoading && [
                styles.buttonDisabled,
                { backgroundColor: theme.colors.border },
              ],
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: '#ffffff' }]}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.subtitle }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text
                style={[styles.loginLink, { color: theme.colors.ctaPrimary }]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
