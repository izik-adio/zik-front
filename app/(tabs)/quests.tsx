import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useGoals, getTaskGoalStoreActions } from '@/src/store/questStore';
import { Goal } from '@/src/api/quests';
import { GoalCard } from '@/components/quests/QuestCard';
import { CreateQuestModal } from '@/components/quests/CreateQuestModal';
import { EmptyStateCard } from '@/components/today/EmptyStateCard';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const goals = useGoals();

  // Get actions from store - memoize to prevent infinite loops
  const actions = useMemo(() => getTaskGoalStoreActions(), []);
  const { fetchGoals, createGoal, updateGoal, deleteGoal, clearError } =
    actions;

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const handleCreateGoal = async (goalData: any) => {
    try {
      await createGoal(goalData);
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create goal'
      );
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete goal'
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Your Goals
        </Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Plus size={24} color={theme.colors.ctaPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {goals.length === 0 ? (
          <EmptyStateCard
            type="goals"
            onAddPress={() => setShowCreateModal(true)}
          />
        ) : (
          goals.map((goal: Goal) => (
            <GoalCard
              key={goal.goalId}
              goal={goal}
              onDelete={() => handleDeleteGoal(goal.goalId)}
            />
          ))
        )}
      </ScrollView>
      <CreateQuestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
});
