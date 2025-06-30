import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';
import { storage } from '@/src/utils/storage';
import { LogoImage } from '@/components/onboarding/LogoImage';
import { showAlert } from '@/utils/showAlert';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signup, confirmSignup } = useAuth();
  const router = useRouter();
  useEffect(() => {
    // Pre-fill the firstName from onboarding data
    const loadPreferredData = async () => {
      try {
        const preferredName = await storage.getItem<string>('preferredName');
        if (preferredName && typeof preferredName === 'string') {
          // Split the preferred name into first and last name
          const nameParts = preferredName.trim().split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setDisplayName(preferredName);
        }
      } catch (error) {
        console.error('Error loading preferred name:', error);
      }
    };

    loadPreferredData();
  }, []);

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Store the profile data for auto profile creation
      await storage.setItem('signupProfileData', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim() || firstName.trim(), // Use firstName if displayName is empty
      });

      const result = await signup(email.trim(), password, firstName.trim());
      if (result.requiresConfirmation) {
        setShowConfirmation(true);
        showAlert(
          'Success',
          'Please check your email for a confirmation code'
        );
      }
    } catch (error: any) {
      // Clear stored profile data on error
      await storage.removeItem('signupProfileData');
      showAlert(
        'Signup Failed',
        error.message || 'An error occurred during signup'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignup = async () => {
    if (!confirmationCode.trim()) {
      showAlert('Error', 'Please enter the confirmation code');
      return;
    }

    setIsLoading(true);
    try {
      // Confirm the account
      await confirmSignup(email.trim(), confirmationCode.trim());

      // After successful confirmation, the user is automatically logged in
      // The ProfileGuard will handle auto-profile creation

      // Clear any stored onboarding data
      await storage.removeItem('preferredName');

      showAlert(
        'Welcome to Zik!',
        'Your account has been confirmed successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // The ProfileGuard will handle profile creation and routing
              router.replace('/');
            }
          }
        ]
      );
    } catch (error: any) {
      showAlert(
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
            We&apos;ve sent a 6-digit code to {email}. Enter it below to confirm
            your account.
          </Text>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor:
                    focusedField === 'confirmationCode'
                      ? theme.colors.ctaPrimary
                      : theme.colors.inputBorder,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Confirmation Code"
                placeholderTextColor={theme.colors.subtitle}
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                onFocus={() => setFocusedField('confirmationCode')}
                onBlur={() => setFocusedField(null)}
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
                borderColor:
                  focusedField === 'firstName'
                    ? theme.colors.ctaPrimary
                    : theme.colors.inputBorder,
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
              placeholder="First Name"
              placeholderTextColor={theme.colors.subtitle}
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor:
                  focusedField === 'lastName'
                    ? theme.colors.ctaPrimary
                    : theme.colors.inputBorder,
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
              placeholder="Last Name"
              placeholderTextColor={theme.colors.subtitle}
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor:
                  focusedField === 'displayName'
                    ? theme.colors.ctaPrimary
                    : theme.colors.inputBorder,
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
              placeholder="Display Name (Optional)"
              placeholderTextColor={theme.colors.subtitle}
              value={displayName}
              onChangeText={setDisplayName}
              onFocus={() => setFocusedField('displayName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor:
                  focusedField === 'email'
                    ? theme.colors.ctaPrimary
                    : theme.colors.inputBorder,
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
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
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
                borderColor:
                  focusedField === 'password'
                    ? theme.colors.ctaPrimary
                    : theme.colors.inputBorder,
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
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
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
              Already have an account?
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
