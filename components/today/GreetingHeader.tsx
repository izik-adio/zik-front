import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface GreetingHeaderProps {
  userName: string;
  completionRate: number;
}

export function GreetingHeader({ userName, completionRate }: GreetingHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const radius = 40;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <Animated.View style={styles.container} entering={FadeInUp.delay(200)}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>
            {getGreeting()}, {userName}!
          </Text>
          <Text style={styles.date}>{getDate()}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Svg width={radius * 2} height={radius * 2} style={styles.progressRing}>
            <Circle
              stroke="#e2e8f0"
              fill="transparent"
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke="#14b8a6"
              fill="transparent"
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius} ${radius})`}
            />
          </Svg>
          <Text style={styles.progressText}>{Math.round(completionRate)}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    transform: [{ rotate: '-90deg' }],
  },
  progressText: {
    position: 'absolute',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#14b8a6',
  },
});