import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Target, ArrowRight, Map, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Goal } from '../../src/api/quests';

interface GoalsOverviewCardProps {
    goals: Goal[];
    activeGoalId?: string | null;
}

export function GoalsOverviewCard({ goals, activeGoalId }: GoalsOverviewCardProps) {
    const { theme } = useTheme();

    if (goals.length === 0) {
        return (
            <TouchableOpacity
                style={[styles.card, styles.emptyCard, { backgroundColor: theme.colors.card }]}
                onPress={() => router.push('/quests' as any)}
            >
                <View style={styles.emptyContent}>
                    <Target size={24} color={theme.colors.ctaPrimary} />
                    <View style={styles.emptyText}>
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            No Goals Yet
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.subtitle }]}>
                            Tap to create your first epic quest
                        </Text>
                    </View>
                    <ArrowRight size={16} color={theme.colors.subtitle} />
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Your Goals ({goals.length})
                </Text>
                <TouchableOpacity onPress={() => router.push('/quests' as any)}>
                    <Text style={[styles.viewAllText, { color: theme.colors.ctaPrimary }]}>
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.goalsContainer}
            >
                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.goalId}
                        style={[
                            styles.goalItem,
                            { backgroundColor: theme.colors.background },
                            activeGoalId === goal.goalId && [
                                styles.activeGoalItem,
                                { borderColor: theme.colors.ctaPrimary }
                            ]
                        ]}
                        onPress={() => router.push(`/epic/${goal.goalId}` as any)}
                    >
                        <View style={styles.goalContent}>
                            <View style={styles.goalHeader}>
                                <Map size={16} color={
                                    activeGoalId === goal.goalId
                                        ? theme.colors.ctaPrimary
                                        : theme.colors.subtitle
                                } />
                                {activeGoalId === goal.goalId && (
                                    <View style={[styles.activeBadge, { backgroundColor: theme.colors.ctaPrimary }]}>
                                        <Text style={styles.activeBadgeText}>Active</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[
                                styles.goalTitle,
                                { color: theme.colors.text }
                            ]} numberOfLines={2}>
                                {goal.goalName}
                            </Text>

                            <View style={styles.goalMeta}>
                                <View style={styles.statusContainer}>
                                    {goal.roadmapStatus === 'ready' ? (
                                        <View style={styles.statusBadge}>
                                            <Target size={12} color={theme.colors.success} />
                                            <Text style={[styles.statusText, { color: theme.colors.success }]}>
                                                Ready
                                            </Text>
                                        </View>
                                    ) : goal.roadmapStatus === 'generating' ? (
                                        <View style={styles.statusBadge}>
                                            <Clock size={12} color={theme.colors.warning} />
                                            <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                                                Generating
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.statusBadge}>
                                            <Clock size={12} color={theme.colors.subtitle} />
                                            <Text style={[styles.statusText, { color: theme.colors.subtitle }]}>
                                                Pending
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyCard: {
        opacity: 0.8,
    },
    emptyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        flex: 1,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    emptySubtitle: {
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    goalsContainer: {
        gap: 12,
        paddingRight: 20,
    },
    goalItem: {
        width: 160,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeGoalItem: {
        borderWidth: 2,
    },
    goalContent: {
        flex: 1,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    goalTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 18,
    },
    goalMeta: {
        marginTop: 'auto',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
