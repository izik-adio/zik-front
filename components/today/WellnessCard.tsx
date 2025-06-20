import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Heart, Play, Pause } from 'lucide-react-native';

export function WellnessCard() {
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
    <Animated.View style={styles.container} entering={FadeInUp.delay(300)}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Heart size={20} color="#f97316" />
        </View>
        <Text style={styles.title}>Wellness Moment</Text>
      </View>
      
      <Text style={styles.description}>
        Take a moment to breathe and center yourself
      </Text>
      
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <TouchableOpacity style={styles.playButton} onPress={toggleTimer}>
          {isActive ? (
            <Pause size={24} color="#ffffff" />
          ) : (
            <Play size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.hint}>
        {isActive ? 'Focus on your breath' : 'Tap to start a 5-minute breathing session'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fef3c7',
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
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1e293b',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
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
    color: '#1e293b',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});