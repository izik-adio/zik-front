import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useActiveRoadmap } from '@/src/store/questStore';
import { RoadmapStatusIndicator } from '@/components/ui/RoadmapStatusIndicator';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface MilestoneFocusCardProps {
    onPress?: () => void;
}

export function MilestoneFocusCard({ onPress }: MilestoneFocusCardProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const activeRoadmap = useActiveRoadmap();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (activeRoadmap.epicQuestId) {
            router.push(`/epic/${activeRoadmap.epicQuestId}`);
        }
    };

    if (!activeRoadmap.epicQuest) {
        return (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: theme.colors.subtitle }]}>
                        No Active Epic Quest
                    </Text>
                    <Text style={[styles.description, { color: theme.colors.subtitle }]}>
                        Create an epic quest to see your roadmap and milestones here.
                    </Text>
                </View>
            </View>
        );
    }

    // Find the active milestone from the milestones array
    const activeMilestone = activeRoadmap.milestones.find(m => m.status === 'active') || null;
    const completedMilestones = activeRoadmap.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = activeRoadmap.milestones.length;
    const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.titleSection}>
                    <Text style={[styles.epicTitle, { color: theme.colors.text }]}>
                        {activeRoadmap.epicQuest.title}
                    </Text>
                    <RoadmapStatusIndicator status={activeRoadmap.epicQuest.roadmapStatus} compact />
                </View>

                <View style={styles.progressSection}>
                    <Text style={[styles.progressText, { color: theme.colors.subtitle }]}>
                        {completedMilestones}/{totalMilestones} milestones
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: theme.colors.ctaPrimary,
                                    width: `${progressPercentage}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {activeMilestone ? (
                <View style={styles.milestoneSection}>
                    <Text style={[styles.milestoneLabel, { color: theme.colors.subtitle }]}>
                        Current Milestone
                    </Text>
                    <Text style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                        {activeMilestone.title}
                    </Text>
                    <Text style={[styles.milestoneDescription, { color: theme.colors.subtitle }]}>
                        {activeMilestone.description}
                    </Text>

                    <View style={styles.milestoneFooter}>
                        <Text style={[styles.durationText, { color: theme.colors.subtitle }]}>
                            {activeMilestone.durationInDays} days
                        </Text>
                        <Text style={[styles.sequenceText, { color: theme.colors.ctaPrimary }]}>
                            Step {activeMilestone.sequence} of {totalMilestones}
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={styles.milestoneSection}>
                    <Text style={[styles.milestoneLabel, { color: theme.colors.subtitle }]}>
                        No Active Milestone
                    </Text>
                    <Text style={[styles.milestoneDescription, { color: theme.colors.subtitle }]}>
                        {activeRoadmap.epicQuest.roadmapStatus === 'generating'
                            ? 'Your roadmap is being generated...'
                            : 'Tap to view your roadmap and activate a milestone'
                        }
                    </Text>
                </View>
            )}

            <View style={styles.actionHint}>
                <Text style={[styles.actionText, { color: theme.colors.ctaPrimary }]}>
                    Tap to view full roadmap →
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginHorizontal: 20,
        marginVertical: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        marginBottom: 16,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    epicTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 12,
    },
    progressSection: {
        gap: 6,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    milestoneSection: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 16,
        marginBottom: 12,
    },
    milestoneLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    milestoneTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    milestoneDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    milestoneFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    durationText: {
        fontSize: 13,
        fontWeight: '500',
    },
    sequenceText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionHint: {
        alignItems: 'center',
        paddingTop: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
