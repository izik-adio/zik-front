import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trophy, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { Goal } from '@/src/api/quests';

interface GoalCardProps {
  goal: Goal;
  completed?: boolean;
  onDelete?: () => void;
}

export function GoalCard({ goal, completed = false, onDelete }: GoalCardProps) {
  const { theme } = useTheme();

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.goalName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(),
        },
      ]
    );
  };

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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {goal.goalName}
          </Text>
          <Text
            style={[
              styles.category,
              { color: getCategoryColor(goal.category || '') },
            ]}
          >
            {goal.category}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.description, { color: theme.colors.subtitle }]}>
        {goal.description}
      </Text>
      <Text style={[styles.status, { color: theme.colors.ctaPrimary }]}>
        Status: {goal.status}
      </Text>
      {goal.targetDate && (
        <Text style={[styles.targetDate, { color: theme.colors.subtitle }]}>
          Target: {goal.targetDate}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    marginTop: 8,
  },
  targetDate: {
    fontSize: 13,
    marginTop: 4,
  },
});
