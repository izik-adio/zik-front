
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Plus, Target, ChevronRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/context/ThemeContext';
import { DailyQuest } from '../../src/api/quests';
import { ProgressiveTaskList } from './ProgressiveTaskList';

interface TodaysFocusSectionProps {
    todayTasks: DailyQuest[];
    futureTasks: DailyQuest[];
    showFuture: boolean;
    completionPercentage: number;
    onTaskComplete: (taskId: string) => Promise<void>;
    onTaskDelete: (taskId: string) => Promise<void>;
    onAddTask: () => void;
    isLoading?: boolean;
}

export function TodaysFocusSection({
    todayTasks = [], // Provide default empty array
    futureTasks = [], // Provide default empty array
    showFuture,
    completionPercentage,
    onTaskComplete,
    onTaskDelete,
    onAddTask,
    isLoading = false,
}: TodaysFocusSectionProps) {
    const { theme } = useTheme();
    const [selectedView, setSelectedView] = useState<'focus' | 'all' | 'completed' | 'future'>('focus');

    // Smart task categorization and progressive disclosure
    const { activeTasks, completedTasks, priorityTasks, nextTasks } = useMemo(() => {
        const active = todayTasks.filter(task => task.status !== 'completed');
        const completed = todayTasks.filter(task => task.status === 'completed');

        // Sort by priority and due time for smart ordering
        const sortedActive = active.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority as keyof typeof priorityOrder] || 2) -
                (priorityOrder[a.priority as keyof typeof priorityOrder] || 2);
        });

        // Show max 3 priority tasks in focus view, rest in "all" view
        const priority = sortedActive.slice(0, 3);
        const next = sortedActive.slice(3);

        return {
            activeTasks: sortedActive,
            completedTasks: completed,
            priorityTasks: priority,
            nextTasks: next
        };
    }, [todayTasks]);

    // Smart view content based on user selection and task state
    const getViewContent = () => {
        switch (selectedView) {
            case 'focus':
                return priorityTasks; // Show only top 3 most important
            case 'all':
                return activeTasks; // Show all active tasks
            case 'completed':
                return completedTasks; // Show completed tasks
            case 'future':
                return futureTasks; // Show future tasks
            default:
                return priorityTasks;
        }
    };

    const viewTasks = getViewContent();

    // Dynamic messaging based on state
    const getContextualMessage = () => {
        if (selectedView === 'focus') {
            if (priorityTasks.length === 0 && completedTasks.length > 0) {
                return "🎉 All priority tasks done! Check 'All' for more.";
            } else if (priorityTasks.length === 0) {
                return "Ready to add your priorities? 🎯";
            } else {
                return `Focus on these ${priorityTasks.length} key tasks today`;
            }
        } else if (selectedView === 'all') {
            return `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''} total`;
        } else if (selectedView === 'completed') {
            return `${completedTasks.length} task${completedTasks.length !== 1 ? 's' : ''} completed today 🎉`;
        } else if (selectedView === 'future') {
            return `${futureTasks.length} task${futureTasks.length !== 1 ? 's' : ''} coming up`;
        }
    };

    // View tab configuration
    const viewTabs = [
        {
            id: 'focus' as const,
            label: 'Focus',
            icon: Target,
            count: priorityTasks.length,
            color: theme.colors.ctaPrimary,
        },
        {
            id: 'all' as const,
            label: 'All',
            icon: Clock,
            count: activeTasks.length,
            color: theme.colors.primary,
        },
        {
            id: 'completed' as const,
            label: 'Done',
            icon: CheckCircle2,
            count: completedTasks.length,
            color: theme.colors.success,
        },
        ...(futureTasks.length > 0 ? [{
            id: 'future' as const,
            label: 'Future',
            icon: Sparkles,
            count: futureTasks.length,
            color: theme.colors.ctaSecondary || theme.colors.primary,
        }] : []),
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            {/* Header with progress and add button */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Target size={20} color={theme.colors.ctaPrimary} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Today's Focus
                    </Text>

                    {/* Progress indicator */}
                    {todayTasks.length > 0 && (
                        <View style={styles.progressContainer}>
                            <Svg width={32} height={32}>
                                <Circle
                                    cx={16}
                                    cy={16}
                                    r={12}
                                    stroke={theme.colors.border}
                                    strokeWidth={2}
                                    fill="none"
                                />
                                <Circle
                                    cx={16}
                                    cy={16}
                                    r={12}
                                    stroke={theme.colors.ctaPrimary}
                                    strokeWidth={2}
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

                <TouchableOpacity
                    onPress={onAddTask}
                    style={[styles.addButton, { backgroundColor: theme.colors.ctaPrimary }]}
                    activeOpacity={0.8}
                >
                    <Plus size={16} color="white" />
                </TouchableOpacity>
            </View>

            {/* Smart view tabs */}
            <View style={styles.tabContainer}>
                {viewTabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setSelectedView(tab.id)}
                        style={[
                            styles.tab,
                            selectedView === tab.id && [styles.activeTab, { backgroundColor: tab.color + '15', borderColor: tab.color }]
                        ]}
                        activeOpacity={0.7}
                    >
                        <tab.icon
                            size={16}
                            color={selectedView === tab.id ? tab.color : theme.colors.subtitle}
                        />
                        <Text style={[
                            styles.tabLabel,
                            { color: selectedView === tab.id ? tab.color : theme.colors.subtitle }
                        ]}>
                            {tab.label}
                        </Text>
                        {tab.count > 0 && (
                            <View style={[
                                styles.tabBadge,
                                { backgroundColor: selectedView === tab.id ? tab.color : theme.colors.border }
                            ]}>
                                <Text style={[
                                    styles.tabBadgeText,
                                    { color: selectedView === tab.id ? 'white' : theme.colors.subtitle }
                                ]}>
                                    {tab.count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contextual message */}
            <Text style={[styles.contextMessage, { color: theme.colors.subtitle }]}>
                {getContextualMessage()}
            </Text>

            {/* Task content area */}
            <View style={styles.contentArea}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.ctaPrimary} />
                        <Text style={[styles.loadingText, { color: theme.colors.subtitle }]}>
                            Loading tasks...
                        </Text>
                    </View>
                ) : viewTasks.length > 0 ? (
                    <ProgressiveTaskList
                        todayTasks={selectedView === 'future' ? [] : viewTasks}
                        futureTasks={selectedView === 'future' ? viewTasks : (selectedView === 'all' ? futureTasks : [])}
                        showFuture={selectedView === 'future' || (selectedView === 'all' && showFuture)}
                        onTaskComplete={onTaskComplete}
                        onTaskDelete={onTaskDelete}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        {selectedView === 'focus' && priorityTasks.length === 0 && nextTasks.length > 0 ? (
                            <View style={styles.emptyContent}>
                                <CheckCircle2 size={32} color={theme.colors.success} />
                                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                    Priority tasks complete! 🎯
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setSelectedView('all')}
                                    style={[styles.viewAllButton, { borderColor: theme.colors.primary }]}
                                >
                                    <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                                        View {nextTasks.length} more task{nextTasks.length !== 1 ? 's' : ''}
                                    </Text>
                                    <ChevronRight size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.emptyContent}>
                                <Target size={32} color={theme.colors.border} />
                                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                    {selectedView === 'completed' ? 'No completed tasks yet' :
                                        selectedView === 'future' ? 'No future tasks yet' :
                                            'No tasks yet'}
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: theme.colors.subtitle }]}>
                                    {selectedView === 'completed'
                                        ? 'Complete some tasks to see them here'
                                        : selectedView === 'future'
                                            ? 'Future tasks will appear here as you progress'
                                            : 'Add your first task to get started'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Future tasks preview - Show when available in focus view or all tasks in 'all' view */}
            {futureTasks.length > 0 && selectedView === 'focus' && (
                <View style={[styles.futureSection, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                    <View style={styles.futureHeader}>
                        <Sparkles size={16} color={theme.colors.ctaPrimary} />
                        <Text style={[styles.futureHeaderText, { color: theme.colors.ctaPrimary }]}>
                            {showFuture ? "Tomorrow's Quests Unlocked! 🔥" : "Preview: Tomorrow's Tasks"}
                        </Text>
                    </View>
                    <View style={styles.futureTasksPreview}>
                        {futureTasks.slice(0, 2).map((task, index) => (
                            <View key={task.questId} style={[styles.futureTaskItem, { borderColor: theme.colors.border }]}>
                                <Clock size={14} color={theme.colors.subtitle} />
                                <Text style={[styles.futureTaskName, { color: theme.colors.text }]} numberOfLines={1}>
                                    {task.title}
                                </Text>
                                <Text style={[styles.futureTaskTime, { color: theme.colors.subtitle }]}>
                                    Tomorrow
                                </Text>
                            </View>
                        ))}
                        {futureTasks.length > 2 && (
                            <Text style={[styles.moreTasksHint, { color: theme.colors.subtitle }]}>
                                +{futureTasks.length - 2} more tomorrow
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    progressContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    progressText: {
        position: 'absolute',
        fontSize: 11,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 8,
        borderRadius: 99,
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent', // Handled by theme
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        // Defined inline with theme
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    tabBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    tabBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    contextMessage: {
        paddingHorizontal: 16,
        paddingTop: 12,
        fontSize: 13,
        fontStyle: 'italic',
    },
    contentArea: {
        padding: 16,
        minHeight: 100, // Prevents layout jumps
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptyContent: {
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: '80%',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 99,
        borderWidth: 1,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    futureSection: {
        padding: 16,
        borderTopWidth: 1,
    },
    futureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    futureHeaderText: {
        fontSize: 14,
        fontWeight: '600',
    },
    futureTasksPreview: {
        gap: 8,
    },
    futureTaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    futureTaskName: {
        flex: 1,
        fontSize: 14,
    },
    futureTaskTime: {
        fontSize: 12,
    },
    moreTasksHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 20,
    },
    loadingText: {
        fontSize: 14,
    },
});
