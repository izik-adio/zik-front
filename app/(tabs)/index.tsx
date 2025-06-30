import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Plus, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useProfile } from '../../src/context/ProfileContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  useActiveMilestoneTasks,
  useTodayTasks,
  useActiveRoadmap,
  useIsRefreshing,
  useEpicQuests,
  useRefreshTodayData,
  useUpdateDailyQuest,
  useCreateDailyQuest,
  useCreateEpicQuest,
  useQuestStore,
  useQuestError,
  useRefreshAllPages,
} from '../../src/store/questStore';
import { DailyQuest } from '../../src/api/quests';
import { AddTaskModal } from '../../components/today/AddTaskModal';
import { CreateDailyQuestData, CreateEpicQuestData } from '@/src/api/quests';
import { EmptyStateCard } from '../../components/today/EmptyStateCard';
import { ProgressiveTaskList } from '../../components/today/ProgressiveTaskList';
import { TodaysFocusSection } from '../../components/today/TodaysFocusSection';
import { MilestoneFocusCard } from '../../components/today/MilestoneFocusCard';

// Import simplified components for cleaner UI
import { SimpleGreetingHeader } from '../../components/today/SimpleGreetingHeader';
import { SimpleWellnessCard } from '../../components/today/SimpleWellnessCard';
import { GoalsOverviewCard } from '../../components/today/GoalsOverviewCard';

export default function TodayScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const activeMilestoneTasks = useActiveMilestoneTasks();
  const todayTasks = useTodayTasks();
  const activeRoadmap = useActiveRoadmap();
  const allEpicQuests = useEpicQuests();
  const isRefreshing = useIsRefreshing();
  const questError = useQuestError();

  // Get individual actions from store to prevent re-renders
  const refreshTodayData = useRefreshTodayData();
  const updateDailyQuest = useUpdateDailyQuest();
  const createDailyQuest = useCreateDailyQuest();
  const createEpicQuest = useCreateEpicQuest();

  // Get the store instance for actions that need to be called
  const refreshAllPages = useRefreshAllPages();
  const questStore = useQuestStore.getState(); // Get store instance for direct method calls

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Ensure we have epic quests loaded
        await questStore.fetchEpicQuests();

        // Refresh today's data if we don't have tasks or they're stale
        if (todayTasks.length === 0) {
          await refreshTodayData();
        }
      } catch (error) {
        console.error('Failed to initialize today screen data:', error);
      }
    };

    initializeData();
  }, []); // Only run on mount

  // Clear errors when user interacts with the screen
  useEffect(() => {
    if (questError) {
      const timer = setTimeout(() => {
        questStore.clearError();
      }, 5000); // Auto clear error after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [questError]);

  // Calculate completion percentage for today's tasks
  const completionPercentage = useMemo(() => {
    if (!todayTasks || todayTasks.length === 0) return 0;
    const completedTasks = todayTasks.filter(
      (task: DailyQuest) => task.status === 'completed'
    );
    return (completedTasks.length / todayTasks.length) * 100;
  }, [todayTasks]);

  // Get available tasks for the UI - use consistent data source
  const availableTasks = useMemo(() => {
    const availableTasksData = questStore.getAvailableTasks();
    return {
      today: todayTasks, // Use consistent data source
      future: availableTasksData.future,
      showFuture: availableTasksData.showFuture,
    };
  }, [todayTasks]);

  const handleRefresh = async () => {
    setIsLocalRefreshing(true);
    try {
      await refreshTodayData();
    } finally {
      setIsLocalRefreshing(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      // Find the task and toggle its status
      const taskToUpdate = activeMilestoneTasks.find(
        (task) => task.questId === taskId
      );
      if (!taskToUpdate) return;

      const newStatus =
        taskToUpdate.status === 'completed' ? 'pending' : 'completed';

      await updateDailyQuest(taskId, { status: newStatus });
      questStore.checkTaskAccessRules();

      // Note: Removed milestone completion checking logic as it's not implemented
      // This simplifies the task toggling and prevents unnecessary complexity
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete task'
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await questStore.deleteDailyQuest(taskId);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete task'
      );
    }
  };

  const handleAddTask = async (
    questData: CreateDailyQuestData | CreateEpicQuestData
  ) => {
    try {
      if (questData.type === 'epic') {
        await createEpicQuest(questData);
      } else {
        // For daily quests, no milestone linking since that logic is removed
        const taskData: CreateDailyQuestData = {
          ...questData,
          // Note: Removed milestoneId assignment as milestone logic is not implemented
        };

        await createDailyQuest(taskData);
      }

      // Refresh all pages to ensure both today and goals pages are updated
      await refreshAllPages();
      setShowAddModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : `Failed to ${
              questData.type === 'epic' ? 'create Epic Quest' : 'add task'
            }`
      );
    }
  };

  return (
    <View
      style={[
        { flex: 1, backgroundColor: theme.colors.background },
        { paddingTop: insets.top },
      ]}
    >
      {/* Single ScrollView with pull-to-refresh for entire content - KISS principle */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isLocalRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.ctaPrimary}
            colors={[theme.colors.ctaPrimary]}
            title="Refreshing your journey..."
            titleColor={theme.colors.subtitle}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Simplified Greeting - Clean and personal */}
        <SimpleGreetingHeader
          firstName={profile?.firstName || 'User'}
          completionRate={completionPercentage}
        />

        {/* Error Display */}
        {questError && (
          <View
            style={[
              styles.errorContainer,
              {
                backgroundColor: (theme.colors.error || '#ff4444') + '20',
                borderColor: theme.colors.error || '#ff4444',
              },
            ]}
          >
            <Text
              style={[
                styles.errorText,
                { color: theme.colors.error || '#ff4444' },
              ]}
            >
              {questError}
            </Text>
            <TouchableOpacity onPress={() => questStore.clearError()}>
              <Text
                style={[
                  styles.errorDismiss,
                  { color: theme.colors.error || '#ff4444' },
                ]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Focus Card - Cohesive design with psychology-based UX */}
        <TodaysFocusSection
          todayTasks={availableTasks.today}
          futureTasks={availableTasks.future}
          showFuture={availableTasks.showFuture}
          completionPercentage={completionPercentage}
          onTaskComplete={handleToggleTask}
          onTaskDelete={handleDeleteTask}
          onAddTask={() => setShowAddModal(true)}
          isLoading={isRefreshing || isLocalRefreshing}
        />

        {/* Simplified Wellness - Keep functionality, minimal UI */}
        <SimpleWellnessCard />

        {/* Goals Status/Overview Section - Strategic context */}
        <View style={styles.sectionHeader}>
          <Target size={20} color={theme.colors.ctaPrimary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Goals Overview
          </Text>
        </View>
        <GoalsOverviewCard
          goals={allEpicQuests}
          activeGoalId={activeRoadmap?.epicQuestId}
        />
      </ScrollView>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  errorDismiss: {
    fontSize: 14,
    fontWeight: '600',
  },
});
