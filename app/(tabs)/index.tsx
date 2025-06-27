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
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveMilestoneTasks, useActiveRoadmap, getTaskGoalStoreActions, useIsRefreshing, useGoals } from '../../src/store/questStore';
import { Task } from '../../src/api/quests';
import { QuestCard } from '../../components/today/QuestCard';
import { AddTaskModal } from '../../components/today/AddTaskModal';
import { EmptyStateCard } from '../../components/today/EmptyStateCard';

// Import simplified components for cleaner UI
import { SimpleGreetingHeader } from '../../components/today/SimpleGreetingHeader';
import { SimpleWellnessCard } from '../../components/today/SimpleWellnessCard';
import { GoalsOverviewCard } from '../../components/today/GoalsOverviewCard';

export default function TodayScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();

  const activeMilestoneTasks = useActiveMilestoneTasks();
  const activeRoadmap = useActiveRoadmap();
  const allGoals = useGoals();
  const isRefreshing = useIsRefreshing();

  // Get actions from store
  const actions = useMemo(() => getTaskGoalStoreActions(), []);
  const {
    fetchActiveMilestoneData,
    markTaskComplete,
    createTask,
    deleteTask,
    refreshTodayData,
  } = actions;

  useEffect(() => {
    if (user) {
      fetchActiveMilestoneData();
    }
  }, [user, fetchActiveMilestoneData]);

  const handleRefresh = async () => {
    if (user && !isRefreshing) {
      await refreshTodayData();
    }
  };

  // Calculate completion percentage for active milestone
  const completionPercentage = useMemo(() => {
    if (!activeMilestoneTasks || activeMilestoneTasks.length === 0) return 0;
    const completedTasks = activeMilestoneTasks.filter((task: Task) => task.status === 'completed');
    return (completedTasks.length / activeMilestoneTasks.length) * 100;
  }, [activeMilestoneTasks]);

  const handleToggleTask = async (taskId: string) => {
    try {
      await markTaskComplete(taskId);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete task'
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete task'
      );
    }
  };

  const handleAddTask = async (
    title: string,
    time: string,
    isEpic: boolean
  ) => {
    try {
      const taskData: any = {
        title,
        dueDate: time,
        description: '',
        priority: 'medium',
      };

      // If there's an active milestone, associate the task with it
      if (activeRoadmap?.activeMilestone) {
        taskData.milestoneId = activeRoadmap.activeMilestone.milestoneId;
      }

      await createTask(taskData);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add task'
      );
    }
  };

  return (
    <View style={[
      { flex: 1, backgroundColor: theme.colors.background },
      { paddingTop: insets.top }
    ]}>
      {/* Single ScrollView with pull-to-refresh for entire content - KISS principle */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
          userName={user?.userName || 'User'}
          completionRate={completionPercentage}
        />

        {/* Today's Tasks Section with Progress Indicator - Most immediate/actionable */}
        <View style={styles.sectionHeader}>
          <View style={styles.tasksHeaderLeft}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Today&apos;s Tasks
            </Text>
            {/* Circular Progress Indicator */}
            {activeMilestoneTasks && activeMilestoneTasks.length > 0 && (
              <View style={styles.progressContainer}>
                <Svg width={32} height={32} style={styles.progressSvg}>
                  {/* Background circle */}
                  <Circle
                    cx={16}
                    cy={16}
                    r={12}
                    stroke={theme.colors.border}
                    strokeWidth={3}
                    fill="none"
                  />
                  {/* Progress circle */}
                  <Circle
                    cx={16}
                    cy={16}
                    r={12}
                    stroke={theme.colors.ctaPrimary}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 12}`}
                    strokeDashoffset={`${2 * Math.PI * 12 * (1 - completionPercentage / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 16 16)"
                  />
                </Svg>
                <Text style={[styles.progressText, { color: theme.colors.ctaPrimary }]}>
                  {Math.round(completionPercentage)}%
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Plus size={24} color={theme.colors.ctaPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksContent}>
          {Array.isArray(activeMilestoneTasks) && activeMilestoneTasks.length === 0 ? (
            <EmptyStateCard
              type="quests"
              onAddPress={() => setShowAddModal(true)}
            />
          ) : (
            (Array.isArray(activeMilestoneTasks) ? activeMilestoneTasks : []).map((task: Task) => (
              <QuestCard
                key={task.taskId}
                quest={task}
                onToggle={() => handleToggleTask(task.taskId)}
                onDelete={() => handleDeleteTask(task.taskId)}
              />
            ))
          )}
        </View>

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
          goals={allGoals}
          activeGoalId={activeRoadmap?.epicId}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tasksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    transform: [{ rotate: '0deg' }],
  },
  progressText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  tasksContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
