import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Plus, Trophy, Target, Calendar } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { questsApi, Task } from '@/src/api/quests';
import { storage } from '@/src/utils/storage';
import { QuestPath } from '@/components/quests/QuestPath';
import { QuestCard } from '@/components/quests/QuestCard';
import { CreateQuestModal } from '@/components/quests/CreateQuestModal';
import { EmptyStateCard } from '@/components/today/EmptyStateCard';

export default function QuestsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localQuests, setLocalQuests] = useState<any[]>([]);

  // Fetch quests from API (Note: the new API doesn't have a generic getQuests method)
  const { data: apiQuests = [] } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      // TODO: Update this to fetch tasks/goals from today or a specific date range
      // For now, return empty array as the new API is date-specific
      return [] as Task[];
    },
    enabled: !!user,
  });

  // Create quest mutation
  const createQuestMutation = useMutation({
    mutationFn: (questData: any) => {
      // Convert local quest format to API format
      return questsApi.createTask({
        title: questData.title,
        description: questData.description,
        dueDate: new Date().toISOString().split('T')[0], // Today
        priority: 'medium',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });

  useEffect(() => {
    loadLocalQuests();
  }, []);

  const loadLocalQuests = async () => {
    try {
      const saved = await storage.getItem('epicQuests');
      if (saved && Array.isArray(saved)) {
        setLocalQuests(saved);
      }
      // Don't set default epic quests for new users - they should see empty state instead
    } catch (error) {
      console.error('Error loading epic quests:', error);
    }
  };

  const createQuest = async (questData: any) => {
    if (user) {
      // Create via API
      try {
        await createQuestMutation.mutateAsync({
          title: questData.title,
          description: questData.description,
        });
      } catch (error) {
        console.error('Error creating quest:', error);
      }
    } else {
      // Create locally
      const newQuest = {
        id: Date.now().toString(),
        ...questData,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedQuests = [...localQuests, newQuest];
      setLocalQuests(updatedQuests);

      try {
        await storage.setItem('epicQuests', updatedQuests);
      } catch (error) {
        console.error('Error saving new quest:', error);
      }
    }
  };

  const updateQuestProgress = async (questId: string, milestoneId: string) => {
    // Handle local quests
    const updatedQuests = localQuests.map((quest) => {
      if (quest.id === questId) {
        const updatedMilestones = quest.milestones.map((milestone: any) => {
          if (milestone.id === milestoneId) {
            return { ...milestone, completed: !milestone.completed };
          }
          return milestone;
        });

        const completedCount = updatedMilestones.filter(
          (m: any) => m.completed
        ).length;
        const progress = (completedCount / updatedMilestones.length) * 100;

        return {
          ...quest,
          milestones: updatedMilestones,
          progress: Math.round(progress),
        };
      }
      return quest;
    });

    setLocalQuests(updatedQuests);

    try {
      await storage.setItem('epicQuests', updatedQuests);
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  };

  // Convert API quests to local format for display
  const convertedApiQuests = apiQuests.map((quest: Task) => ({
    id: quest.taskId,
    title: quest.taskName,
    description: quest.description,
    category: 'general',
    progress: quest.status === 'completed' ? 100 : 0,
    milestones: [
      {
        id: '1',
        title: quest.description,
        completed: quest.status === 'completed',
      },
    ],
    createdAt: quest.createdAt,
  }));

  const allQuests = [...localQuests, ...convertedApiQuests];
  const completedQuests = allQuests.filter((q) => q.progress === 100);
  const activeQuests = allQuests.filter((q) => q.progress < 100);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Epic Quests
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.subtitle }]}>
          Your journey to greatness
        </Text>

        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: theme.colors.ctaPrimary },
          ]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>New Quest</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.pathContainer, { backgroundColor: theme.colors.card }]}
        >
          <QuestPath quests={activeQuests} />
        </View>

        <View style={[styles.stats, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statItem}>
            <Target size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {activeQuests.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtitle }]}>
              Active
            </Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={24} color="#f97316" />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {completedQuests.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtitle }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={24} color="#8b5cf6" />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {allQuests.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtitle }]}>
              Total
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Active Quests
          </Text>

          {activeQuests.length === 0 ? (
            <EmptyStateCard
              type="goals"
              onAddPress={() => setShowCreateModal(true)}
            />
          ) : (
            activeQuests.map((quest, index) => (
              <Animated.View
                key={quest.id}
                entering={FadeInUp.delay(index * 100)}
              >
                <QuestCard
                  quest={quest}
                  onMilestoneToggle={(milestoneId) =>
                    updateQuestProgress(quest.id, milestoneId)
                  }
                />
              </Animated.View>
            ))
          )}
        </View>

        {completedQuests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Completed Quests
            </Text>
            {completedQuests.map((quest, index) => (
              <Animated.View
                key={quest.id}
                entering={FadeInUp.delay(index * 100)}
              >
                <QuestCard
                  quest={quest}
                  completed={true}
                  onMilestoneToggle={() => {}}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateQuestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createQuest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  pathContainer: {
    padding: 20,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    marginBottom: 8,
  },
});
