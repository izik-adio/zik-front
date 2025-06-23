import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Heart, Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

export function WellnessCard() {
  const { theme } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    // In a real app, you would implement actual timer logic here
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

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: theme.colors.text }]}>
          {formatTime(timeLeft)}
        </Text>
        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: theme.colors.ctaPrimary },
          ]}
          onPress={toggleTimer}
        >
          {isActive ? (
            <Pause size={24} color="white" />
          ) : (
            <Play size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: theme.colors.subtitle }]}>
        {isActive
          ? 'Focus on your breath'
          : 'Tap to start a 5-minute breathing session'}
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
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
