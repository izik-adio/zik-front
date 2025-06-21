import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { goalsApi, Goal } from '@/src/api/goals';
import { storage } from '@/src/utils/storage';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { QuestCard } from '@/components/today/QuestCard';
import { WellnessCard } from '@/components/today/WellnessCard';
import { AddTaskModal } from '@/components/today/AddTaskModal';

export default function TodayScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [localQuests, setLocalQuests] = useState<any[]>([]);
  const [completedQuests, setCompletedQuests] = useState<any[]>([]);

  // Fetch goals from API
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getGoals,
    enabled: !!user,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: goalsApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: any }) =>
      goalsApi.updateGoal(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
  useEffect(() => {
    loadLocalQuests();
  }, []);

  const loadLocalQuests = async () => {
    try {
      const savedQuests = await storage.getItem('dailyQuests');
      const savedCompleted = await storage.getItem('completedQuests');

      if (savedQuests && Array.isArray(savedQuests)) {
        setLocalQuests(savedQuests);
      } else {
        // Default quests
        const defaultQuests = [
          {
            id: '1',
            title: 'Morning meditation',
            time: '10 min',
            icon: 'brain',
            isEpic: false,
          },
          {
            id: '2',
            title: 'Drink 8 glasses of water',
            time: 'All day',
            icon: 'droplets',
            isEpic: false,
          },
          {
            id: '3',
            title: 'Practice gratitude',
            time: '5 min',
            icon: 'heart',
            isEpic: true,
          },
        ];
        setLocalQuests(defaultQuests);
      }

      if (savedCompleted && Array.isArray(savedCompleted)) {
        setCompletedQuests(savedCompleted);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  };

  const toggleQuest = async (questId: string) => {
    const quest = localQuests.find((q) => q.id === questId);
    if (!quest) return;

    const newQuests = localQuests.filter((q) => q.id !== questId);
    const newCompleted = [
      ...completedQuests,
      { ...quest, completedAt: new Date().toISOString() },
    ];

    setLocalQuests(newQuests);
    setCompletedQuests(newCompleted);

    try {
      await storage.setItem('dailyQuests', newQuests);
      await storage.setItem('completedQuests', newCompleted);
    } catch (error) {
      console.error('Error saving quest completion:', error);
    }
  };

  const addQuest = async (title: string, time: string, isEpic: boolean) => {
    if (isEpic && user) {
      // Create as a goal via API
      try {
        await createGoalMutation.mutateAsync({
          title,
          description: `Epic quest: ${title}`,
          category: 'personal',
        });
      } catch (error) {
        console.error('Error creating goal:', error);
      }
    } else {
      // Create as local quest
      const newQuest = {
        id: Date.now().toString(),
        title,
        time,
        icon: 'target',
        isEpic,
      };

      const updatedQuests = [...localQuests, newQuest];
      setLocalQuests(updatedQuests);

      try {
        await storage.setItem('dailyQuests', updatedQuests);
      } catch (error) {
        console.error('Error saving new quest:', error);
      }
    }
  };

  const toggleGoal = async (goalId: string) => {
    const goal = goals.find((g) => g.goalId === goalId);
    if (!goal) return;

    const newStatus = goal.status === 'completed' ? 'active' : 'completed';

    try {
      await updateGoalMutation.mutateAsync({
        goalId,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Convert goals to quest format for display
  const goalQuests = goals.map((goal) => ({
    id: goal.goalId,
    title: goal.title,
    time: 'Ongoing',
    icon: 'target',
    isEpic: true,
  }));

  const allQuests = [...localQuests, ...goalQuests];
  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const completionRate =
    allQuests.length > 0
      ? ((completedQuests.length + completedGoals.length) /
          (allQuests.length + completedQuests.length + completedGoals.length)) *
        100
      : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <GreetingHeader
          userName={user?.userName || 'Friend'}
          completionRate={completionRate}
        />

        <View style={styles.content}>
          <WellnessCard />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Today's Quests
            </Text>
            {localQuests.map((quest) => (
              <Animated.View
                key={quest.id}
                entering={FadeInUp.delay(100)}
                exiting={FadeOutUp}
              >
                <QuestCard
                  quest={quest}
                  onToggle={() => toggleQuest(quest.id)}
                />
              </Animated.View>
            ))}
            {activeGoals.map((goal) => (
              <Animated.View
                key={goal.goalId}
                entering={FadeInUp.delay(100)}
                exiting={FadeOutUp}
              >
                <QuestCard
                  quest={{
                    id: goal.goalId,
                    title: goal.title,
                    time: 'Ongoing',
                    icon: 'target',
                    isEpic: true,
                  }}
                  onToggle={() => toggleGoal(goal.goalId)}
                />
              </Animated.View>
            ))}
          </View>

          {(completedQuests.length > 0 || completedGoals.length > 0) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Completed
              </Text>
              {completedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  completed={true}
                  onToggle={() => {}}
                />
              ))}
              {completedGoals.map((goal) => (
                <QuestCard
                  key={goal.goalId}
                  quest={{
                    id: goal.goalId,
                    title: goal.title,
                    time: 'Completed',
                    icon: 'target',
                    isEpic: true,
                  }}
                  completed={true}
                  onToggle={() => {}}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addQuest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
