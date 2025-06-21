import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle, Trophy } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    milestones: Array<{
      id: string;
      title: string;
      completed: boolean;
    }>;
    progress: number;
    category: string;
  };
  completed?: boolean;
  onMilestoneToggle: (milestoneId: string) => void;
}

export function QuestCard({
  quest,
  completed = false,
  onMilestoneToggle,
}: QuestCardProps) {
  const { theme } = useTheme();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wellness':
        return '#14b8a6';
      case 'fitness':
        return '#f97316';
      case 'learning':
        return '#8b5cf6';
      case 'creativity':
        return '#ec4899';
      default:
        return '#64748b';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: completed ? theme.colors.card : theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text,
          opacity: completed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: completed ? theme.colors.subtitle : theme.colors.text },
            ]}
          >
            {quest.title}
          </Text>
          {completed && (
            <Trophy
              size={20}
              color={theme.colors.warning}
              style={styles.trophy}
            />
          )}
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(quest.category) + '20' },
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              { color: getCategoryColor(quest.category) },
            ]}
          >
            {quest.category}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.description,
          { color: completed ? theme.colors.subtitle : theme.colors.subtitle },
        ]}
      >
        {quest.description}
      </Text>

      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${quest.progress}%`,
                backgroundColor: getCategoryColor(quest.category),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {quest.progress}%
        </Text>
      </View>

      <View style={styles.milestones}>
        {quest.milestones.map((milestone) => (
          <TouchableOpacity
            key={milestone.id}
            style={styles.milestone}
            onPress={() => !completed && onMilestoneToggle(milestone.id)}
            disabled={completed}
          >
            {milestone.completed ? (
              <CheckCircle size={20} color={theme.colors.primary} />
            ) : (
              <Circle size={20} color={theme.colors.border} />
            )}
            <Text
              style={[
                styles.milestoneText,
                {
                  color: milestone.completed
                    ? theme.colors.subtitle
                    : theme.colors.text,
                  textDecorationLine: milestone.completed
                    ? 'line-through'
                    : 'none',
                },
              ]}
            >
              {milestone.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  trophy: {
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    minWidth: 40,
    textAlign: 'right',
  },
  milestones: {
    gap: 12,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
  },
});
