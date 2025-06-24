import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Heart,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function WellnessCard() {
  const { theme } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request notification permissions on component mount
  useEffect(() => {
    requestNotificationPermissions();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsActive(false);
            sendCompletionNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notification Permission',
        'Please enable notifications to get alerts when your wellness session is complete.',
        [{ text: 'OK' }]
      );
    }
  };

  const sendCompletionNotification = async () => {
    const minutes = Math.floor(initialTime / 60);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧘‍♀️ Wellness Session Complete!',
          body: `Great job! You've completed your ${minutes}-minute wellness moment. Take a deep breath and feel the calm.`,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (timeLeft === 0) {
      // Reset timer
      setTimeLeft(initialTime);
      setIsActive(false);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const adjustMinutes = (change: number) => {
    if (isActive) return; // Don't allow changes while timer is running

    const newMinutes = Math.floor(initialTime / 60) + change;
    if (newMinutes < 1 || newMinutes > 60) return; // Limit between 1-60 minutes

    const newTime = newMinutes * 60;
    setInitialTime(newTime);
    setTimeLeft(newTime);
  };

  const addMinute = () => adjustMinutes(1);
  const removeMinute = () => adjustMinutes(-1);

  const getTimerColor = () => {
    if (timeLeft === 0) return theme.colors.success || '#4CAF50';
    if (timeLeft < 60) return theme.colors.warning || '#FF9800';
    return theme.colors.text;
  };

  const getHintText = () => {
    const minutes = Math.floor(initialTime / 60);
    if (timeLeft === 0) return 'Session complete! Tap to start a new one';
    if (isActive) return 'Focus on your breath and relax';
    return `Tap to start a ${minutes}-minute breathing session`;
  };

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      entering={FadeInUp.delay(300)}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.accent + '20' },
          ]}
        >
          <Heart size={20} color={theme.colors.accent} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Wellness Moment
        </Text>
      </View>

      <Text style={[styles.description, { color: theme.colors.subtitle }]}>
        Take a moment to breathe and center yourself
      </Text>

      {!isActive && timeLeft === initialTime && (
        <View style={styles.minuteAdjuster}>
          <TouchableOpacity
            style={[
              styles.adjustButton,
              {
                borderColor: theme.colors.subtitle,
                opacity: Math.floor(initialTime / 60) <= 1 ? 0.5 : 1,
              },
            ]}
            onPress={removeMinute}
            disabled={Math.floor(initialTime / 60) <= 1}
          >
            <Minus size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          <Text style={[styles.minuteText, { color: theme.colors.text }]}>
            {Math.floor(initialTime / 60)} min
          </Text>

          <TouchableOpacity
            style={[
              styles.adjustButton,
              {
                borderColor: theme.colors.subtitle,
                opacity: Math.floor(initialTime / 60) >= 60 ? 0.5 : 1,
              },
            ]}
            onPress={addMinute}
            disabled={Math.floor(initialTime / 60) >= 60}
          >
            <Plus size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(timeLeft)}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor:
                  timeLeft === 0
                    ? theme.colors.success || '#4CAF50'
                    : theme.colors.ctaPrimary,
              },
            ]}
            onPress={toggleTimer}
          >
            {timeLeft === 0 ? (
              <RotateCcw size={24} color="white" />
            ) : isActive ? (
              <Pause size={24} color="white" />
            ) : (
              <Play size={24} color="white" />
            )}
          </TouchableOpacity>
          {(isActive || timeLeft !== initialTime) && timeLeft > 0 && (
            <TouchableOpacity
              style={[
                styles.resetButton,
                { borderColor: theme.colors.subtitle },
              ]}
              onPress={resetTimer}
            >
              <RotateCcw size={20} color={theme.colors.subtitle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.hint, { color: theme.colors.subtitle }]}>
        {getHintText()}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  minuteAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minuteText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
});
