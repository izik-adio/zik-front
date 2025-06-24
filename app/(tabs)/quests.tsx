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
import { Plus, Trophy, Target, Calendar } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useQuestStore, getQuestStoreActions } from '@/src/store/questStore';
import { QuestPath } from '@/components/quests/QuestPath';
import { QuestCard } from '@/components/quests/QuestCard';
import { CreateQuestModal } from '@/components/quests/CreateQuestModal';
import { EmptyStateCard } from '@/components/today/EmptyStateCard';

export default function QuestsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { epicQuests, isLoading, error, lastFetch } = useQuestStore();

  // Get actions from store - memoize to prevent infinite loops
  const actions = useMemo(() => getQuestStoreActions(), []);
  const {
    fetchQuests,
    fetchQuestsFromCache,
    createQuest,
    updateQuest,
    deleteQuest,
    clearError,
  } = actions;

  useEffect(() => {
    if (user) {
      // First, try to load from cache immediately
      fetchQuestsFromCache();

      // Then refresh from API in the background
      // Only fetch if data is stale (older than 5 minutes) or doesn't exist
      const shouldRefresh =
        !lastFetch ||
        Date.now() - new Date(lastFetch).getTime() > 5 * 60 * 1000;

      if (shouldRefresh) {
        fetchQuests();
      }
    }
  }, [user]); // Only depend on user, not on the functions or lastFetch

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleCreateQuest = async (questData: any) => {
    try {
      await createQuest({
        title: questData.title,
        type: 'goal',
        description: questData.description,
        category: questData.category,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating quest:', error);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      await deleteQuest(questId, 'goal');
    } catch (error) {
      console.error('Error deleting quest:', error);
      Alert.alert('Error', 'Failed to delete quest. Please try again.');
    }
  };

  const handleUpdateQuestProgress = async (
    questId: string,
    milestoneId: string
  ) => {
    try {
      // For now, we'll toggle between active and completed status
      const quest = (epicQuests || []).find((q) => q.questId === questId);
      if (quest) {
        const newStatus = quest.status === 'completed' ? 'active' : 'completed';
        await updateQuest(questId, { status: newStatus }, 'goal');
      }
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  };

  // Convert Epic Quests to local format for display
  const convertedQuests = (epicQuests || []).map((quest) => ({
    id: quest.questId,
    title: quest.title,
    description: quest.description || '',
    category: quest.category || 'general',
    progress: quest.status === 'completed' ? 100 : 50, // Simplified progress
    milestones: [
      {
        id: '1',
        title: quest.description || quest.title,
        completed: quest.status === 'completed',
      },
    ],
    createdAt: quest.createdAt,
  }));

  const completedQuests = (convertedQuests || []).filter(
    (q) => q.progress === 100
  );
  const activeQuests = (convertedQuests || []).filter((q) => q.progress < 100);

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
        {isLoading ? (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading your quests...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.pathContainer,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <QuestPath quests={activeQuests || []} />
            </View>

            <View
              style={[styles.stats, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.statItem}>
                <Target size={24} color={theme.colors.primary} />
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {activeQuests.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.subtitle }]}
                >
                  Active
                </Text>
              </View>
              <View style={styles.statItem}>
                <Trophy size={24} color="#f97316" />
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {completedQuests.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.subtitle }]}
                >
                  Completed
                </Text>
              </View>
              <View style={styles.statItem}>
                <Calendar size={24} color="#8b5cf6" />
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {convertedQuests.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.subtitle }]}
                >
                  Total
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Active Quests
              </Text>

              {(activeQuests || []).length === 0 ? (
                <EmptyStateCard
                  type="goals"
                  onAddPress={() => setShowCreateModal(true)}
                />
              ) : (
                (activeQuests || []).map((quest, index) => (
                  <Animated.View
                    key={quest.id}
                    entering={FadeInUp.delay(index * 100)}
                  >
                    <QuestCard
                      quest={quest}
                      onMilestoneToggle={(milestoneId) =>
                        handleUpdateQuestProgress(quest.id, milestoneId)
                      }
                      onDelete={() => handleDeleteQuest(quest.id)}
                    />
                  </Animated.View>
                ))
              )}
            </View>

            {(completedQuests || []).length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Completed Quests
                </Text>
                {(completedQuests || []).map((quest, index) => (
                  <Animated.View
                    key={quest.id}
                    entering={FadeInUp.delay(index * 100)}
                  >
                    <QuestCard
                      quest={quest}
                      completed={true}
                      onMilestoneToggle={() => {}}
                      onDelete={() => handleDeleteQuest(quest.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CreateQuestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateQuest}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
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
