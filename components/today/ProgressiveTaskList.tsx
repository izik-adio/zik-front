import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { DailyQuest } from '../../src/api/quests';
import { showAlert } from '../../utils/showAlert';

interface ProgressiveTaskListProps {
  todayTasks: DailyQuest[];
  futureTasks: DailyQuest[];
  showFuture: boolean;
  onTaskComplete: (taskId: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
}

export function ProgressiveTaskList({
  todayTasks,
  futureTasks,
  showFuture,
  onTaskComplete,
  onTaskDelete,
}: ProgressiveTaskListProps) {
  const { theme } = useTheme();

  const handleTaskToggle = async (taskId: string) => {
    try {
      await onTaskComplete(taskId);
    } catch (error) {
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete task'
      );
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    showAlert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onTaskDelete(taskId),
      },
    ]);
  };

  const TaskItem = ({
    task,
    isFuture = false,
  }: {
    task: DailyQuest;
    isFuture?: boolean;
  }) => (
    <View
      style={[
        styles.taskItem,
        {
          backgroundColor: isFuture
            ? theme.colors.ctaSecondary + '20' || theme.colors.card
            : theme.colors.card,
          borderColor: isFuture
            ? theme.colors.ctaSecondary
            : theme.colors.border,
          opacity: isFuture ? 0.8 : 1,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => handleTaskToggle(task.questId)}
        style={styles.taskToggle}
      >
        {task.status === 'completed' ? (
          <CheckCircle2 size={24} color={theme.colors.ctaPrimary} />
        ) : (
          <Circle size={24} color={theme.colors.subtitle} />
        )}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            {
              color: isFuture ? theme.colors.subtitle : theme.colors.text,
              textDecorationLine:
                task.status === 'completed' ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title || 'Untitled Task'}
        </Text>

        {task.description && (
          <Text
            style={[styles.taskDescription, { color: theme.colors.subtitle }]}
          >
            {task.description}
          </Text>
        )}

        {isFuture && (
          <View style={styles.futureIndicator}>
            <Clock size={14} color={theme.colors.ctaSecondary} />
            <Text
              style={[styles.futureText, { color: theme.colors.ctaSecondary }]}
            >
              Future Task
            </Text>
          </View>
        )}

        <View style={styles.taskMeta}>
          <Text style={[styles.taskDueDate, { color: theme.colors.subtitle }]}>
            {task.dueDate ? `Due: ${task.dueDate}` : 'No due date'}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor:
                  task.priority === 'high'
                    ? '#fee2e2'
                    : task.priority === 'medium'
                    ? '#fef3c7'
                    : '#f0f9ff',
              },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                {
                  color:
                    task.priority === 'high'
                      ? '#dc2626'
                      : task.priority === 'medium'
                      ? '#d97706'
                      : '#2563eb',
                },
              ]}
            >
              {task.priority || 'normal'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleTaskDelete(task.questId)}
        style={styles.deleteButton}
      >
        <Text style={[styles.deleteText, { color: theme.colors.error }]}>
          ×
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Today's Tasks */}
      {todayTasks.length === 0 && futureTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckCircle2 size={48} color={theme.colors.ctaPrimary} />
          <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>
            No tasks available! 🎉
          </Text>
        </View>
      ) : (
        <View>
          {todayTasks.map((task) => (
            <TaskItem key={`today-${task.questId}`} task={task} />
          ))}

          {/* Future Tasks (shown when showFuture is true) */}
          {showFuture && futureTasks.length > 0 && (
            <View style={styles.futureTasksContainer}>
              {todayTasks.length > 0 && (
                <Text
                  style={[
                    styles.motivationText,
                    { color: theme.colors.subtitle },
                  ]}
                >
                  You're on fire! Future tasks unlocked.
                </Text>
              )}
              {futureTasks.map((task) => (
                <TaskItem
                  key={`future-${task.questId}`}
                  task={task}
                  isFuture={true}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0, // Remove padding since parent handles it
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  futureSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  futureTasksContainer: {
    marginTop: 8,
  },
  motivationText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  taskToggle: {
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  futureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  futureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskDueDate: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
