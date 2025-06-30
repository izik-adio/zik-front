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
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { LogoImage } from '@/components/onboarding/LogoImage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { login, forgotPassword, confirmForgotPassword } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Clear any previous errors on component mount
  useEffect(() => {
    if (isInitialLoad) {
      setLoginError(null);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setLoginError(null);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setResetStep('code');
      Alert.alert('Success', 'Password reset code sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await confirmForgotPassword(email.trim(), resetCode.trim(), newPassword);
      Alert.alert('Success', 'Password reset successfully');
      setShowForgotPassword(false);
      setResetStep('email');
      setResetCode('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
            {resetStep === 'email'
              ? 'Enter your email to receive a reset code'
              : 'Enter the code sent to your email and your new password'}
          </Text>

          {resetStep === 'email' ? (
            <>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor:
                      focusedField === 'resetEmail'
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
                  onFocus={() => setFocusedField('resetEmail')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.ctaPrimary },
                  isLoading && [
                    styles.buttonDisabled,
                    { backgroundColor: theme.colors.subtitle },
                  ],
                ]}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor:
                      focusedField === 'resetCode'
                        ? theme.colors.ctaPrimary
                        : theme.colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Reset Code"
                  placeholderTextColor={theme.colors.subtitle}
                  value={resetCode}
                  onChangeText={setResetCode}
                  onFocus={() => setFocusedField('resetCode')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor:
                      focusedField === 'resetPassword'
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
                  placeholder="New Password"
                  placeholderTextColor={theme.colors.subtitle}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedField('resetPassword')}
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
                    { backgroundColor: theme.colors.subtitle },
                  ],
                ]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setShowForgotPassword(false);
              setResetStep('email');
              setResetCode('');
              setNewPassword('');
            }}
          >
            <Text style={[styles.linkText, { color: theme.colors.ctaPrimary }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
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
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
          Sign in to continue your journey
        </Text>

        {loginError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {loginError}
            </Text>
          </View>
        )}
        <View style={styles.form}>
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
              onFocus={() => {
                setFocusedField('email');
                setLoginError(null);
              }}
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
              onFocus={() => {
                setFocusedField('password');
                setLoginError(null);
              }}
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
            style={styles.forgotPassword}
            onPress={() => setShowForgotPassword(true)}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                { color: theme.colors.ctaPrimary },
              ]}
            >
              Forgot your password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.ctaPrimary },
              isLoading && [
                styles.buttonDisabled,
                { backgroundColor: theme.colors.subtitle },
              ],
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: theme.colors.subtitle }]}>
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text
                style={[styles.signupLink, { color: theme.colors.ctaPrimary }]}
              >
                Sign Up
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
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
    color: '#ffffff',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  signupLink: {
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
