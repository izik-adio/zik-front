import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useQuestStore, getQuestStoreActions } from '@/src/store/questStore';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { QuestCard } from '@/components/today/QuestCard';
import { WellnessCard } from '@/components/today/WellnessCard';
import { AddTaskModal } from '@/components/today/AddTaskModal';
import { EmptyStateCard } from '@/components/today/EmptyStateCard';

export default function TodayScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);

  const { dailyQuests, epicQuests, isLoading, error, lastFetch } =
    useQuestStore();

  // Get actions from store
  const actions = getQuestStoreActions();
  const {
    fetchTodayQuests,
    fetchQuestsFromCache,
    markQuestComplete,
    createQuest,
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
        fetchTodayQuests();
      }
    }
  }, [user, fetchTodayQuests, fetchQuestsFromCache, lastFetch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleToggleQuest = async (questId: string, isEpic: boolean) => {
    try {
      await markQuestComplete(questId, isEpic ? 'goal' : 'task');
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const handleDeleteQuest = async (questId: string, isEpic: boolean) => {
    try {
      await deleteQuest(questId, isEpic ? 'goal' : 'task');
    } catch (error) {
      console.error('Error deleting quest:', error);
      Alert.alert('Error', 'Failed to delete quest. Please try again.');
    }
  };

  const handleAddQuest = async (
    title: string,
    time: string,
    isEpic: boolean
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      await createQuest({
        title,
        type: isEpic ? 'goal' : 'task',
        description: isEpic ? `Epic quest: ${title}` : undefined,
        dueDate: isEpic ? undefined : today,
        priority: 'medium',
        category: 'personal',
      });

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating quest:', error);
    }
  };

  // Filter active quests - ensure arrays are defined
  const activeDailyQuests = (dailyQuests || []).filter(
    (quest) => quest.status !== 'completed'
  );
  const activeEpicQuests = (epicQuests || []).filter(
    (quest) => quest.status !== 'completed'
  );
  const completedDailyQuests = (dailyQuests || []).filter(
    (quest) => quest.status === 'completed'
  );
  const completedEpicQuests = (epicQuests || []).filter(
    (quest) => quest.status === 'completed'
  );

  const totalQuests = (dailyQuests?.length || 0) + (epicQuests?.length || 0);
  const completedCount =
    completedDailyQuests.length + completedEpicQuests.length;
  const completionRate =
    totalQuests > 0 ? (completedCount / totalQuests) * 100 : 0;

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
              Today&apos;s Quests
            </Text>

            {activeDailyQuests.length === 0 && activeEpicQuests.length === 0 ? (
              <EmptyStateCard
                type="quests"
                onAddPress={() => setShowAddModal(true)}
              />
            ) : (
              <>
                {activeDailyQuests.map((quest) => (
                  <Animated.View
                    key={quest.questId}
                    entering={FadeInUp.delay(100)}
                    exiting={FadeOutUp}
                  >
                    <QuestCard
                      quest={{
                        id: quest.questId,
                        title: quest.title,
                        time: quest.dueDate,
                        icon: 'target',
                        isEpic: false,
                      }}
                      onToggle={() => handleToggleQuest(quest.questId, false)}
                      onDelete={() => handleDeleteQuest(quest.questId, false)}
                    />
                  </Animated.View>
                ))}
                {activeEpicQuests.map((quest) => (
                  <Animated.View
                    key={quest.questId}
                    entering={FadeInUp.delay(100)}
                    exiting={FadeOutUp}
                  >
                    <QuestCard
                      quest={{
                        id: quest.questId,
                        title: quest.title,
                        time: 'Ongoing',
                        icon: 'target',
                        isEpic: true,
                      }}
                      onToggle={() => handleToggleQuest(quest.questId, true)}
                      onDelete={() => handleDeleteQuest(quest.questId, true)}
                    />
                  </Animated.View>
                ))}
              </>
            )}
          </View>

          {(completedDailyQuests.length > 0 ||
            completedEpicQuests.length > 0) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Completed
              </Text>
              {completedDailyQuests.map((quest) => (
                <QuestCard
                  key={`completed-daily-${quest.questId}`}
                  quest={{
                    id: quest.questId,
                    title: quest.title,
                    time: quest.dueDate,
                    icon: 'target',
                    isEpic: false,
                  }}
                  completed={true}
                  onToggle={() => {}}
                />
              ))}
              {completedEpicQuests.map((quest) => (
                <QuestCard
                  key={`completed-epic-${quest.questId}`}
                  quest={{
                    id: quest.questId,
                    title: quest.title,
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
        style={[styles.fab, { backgroundColor: theme.colors.ctaPrimary }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddQuest}
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
