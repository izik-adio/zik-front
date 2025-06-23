import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Plus, Target, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface EmptyStateCardProps {
  type: 'quests' | 'goals';
  onAddPress: () => void;
}

export function EmptyStateCard({ type, onAddPress }: EmptyStateCardProps) {
  const { theme } = useTheme();

  const getContent = () => {
    if (type === 'quests') {
      return {
        icon: <Calendar size={32} color={theme.colors.accent} />,
        title: "Ready for Today's Adventure?",
        description:
          'Start your journey by creating your first quest. Turn everyday tasks into meaningful experiences.',
        buttonText: 'Create First Quest',
      };
    } else {
      return {
        icon: <Target size={32} color={theme.colors.accent} />,
        title: 'Set Your Path',
        description:
          'Define your goals and watch your progress unfold. Every great journey begins with a single step.',
        buttonText: 'Set First Goal',
      };
    }
  };

  const content = getContent();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      entering={FadeInUp.delay(200)}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.accent + '15' },
          ]}
        >
          {content.icon}
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {content.title}
        </Text>

        <Text style={[styles.description, { color: theme.colors.subtitle }]}>
          {content.description}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.ctaPrimary }]}
          onPress={onAddPress}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.buttonText}>{content.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 280,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});
