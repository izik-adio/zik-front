import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/context/ThemeContext';

interface GreetingHeaderProps {
  userName: string;
  completionRate: number;
}

export function GreetingHeader({
  userName,
  completionRate,
}: GreetingHeaderProps) {
  const { theme } = useTheme();

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
  const strokeDashoffset =
    circumference - (completionRate / 100) * circumference;
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderBottomColor: theme.colors.border,
        },
      ]}
      entering={FadeInUp.delay(200)}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            {getGreeting()}, {userName}!
          </Text>
          <Text style={[styles.date, { color: theme.colors.subtitle }]}>
            {getDate()}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <Svg
            width={radius * 2}
            height={radius * 2}
            style={styles.progressRing}
          >
            <Circle
              stroke={theme.colors.border}
              fill="transparent"
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke={theme.colors.primary}
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
          <Text style={[styles.progressText, { color: theme.colors.primary }]}>
            {Math.round(completionRate)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
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
  },
});
