import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface SimpleGreetingHeaderProps {
  firstName: string;
  completionRate: number;
}

export function SimpleGreetingHeader({
  firstName,
  completionRate,
}: SimpleGreetingHeaderProps) {
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

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          {getGreeting()}, {firstName}!
        </Text>
        <Text style={[styles.date, { color: theme.colors.subtitle }]}>
          {getDate()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  textSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
});
