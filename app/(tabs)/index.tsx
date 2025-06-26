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
import { useTasks, getTaskGoalStoreActions } from '@/src/store/questStore';
import { Task } from '@/src/api/quests';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { QuestCard } from '@/components/today/QuestCard';
import { WellnessCard } from '@/components/today/WellnessCard';
import { AddTaskModal } from '@/components/today/AddTaskModal';
import { EmptyStateCard } from '@/components/today/EmptyStateCard';

export default function TodayScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);

  const tasks = useTasks();

  // Get actions from store
  const actions = getTaskGoalStoreActions();
  const {
    fetchTodayTasks,
    fetchTasksFromCache,
    markTaskComplete,
    createTask,
    deleteTask,
    clearError,
  } = actions;

  useEffect(() => {
    if (user) {
      fetchTodayTasks();
    }
  }, [user]);

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
      await createTask({
        title,
        dueDate: time,
        description: '',
        priority: 'medium',
      });
      setShowAddModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add task'
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GreetingHeader userName={user?.userName || 'User'} completionRate={0} />
      <WellnessCard />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Today's Tasks
        </Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={theme.colors.ctaPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {Array.isArray(tasks) && tasks.length === 0 ? (
          <EmptyStateCard
            type="quests"
            onAddPress={() => setShowAddModal(true)}
          />
        ) : (
          (Array.isArray(tasks) ? tasks : []).map((task: Task) => (
            <QuestCard
              key={task.taskId}
              quest={task}
              onToggle={() => handleToggleTask(task.taskId)}
              onDelete={() => handleDeleteTask(task.taskId)}
            />
          ))
        )}
      </ScrollView>
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
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
