import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Map, Clock, CheckCircle, Loader, RefreshCw, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { EpicQuest, Milestone } from '../../src/api/quests';
import { useFetchRoadmap } from '../../src/store/questStore';
import { RoadmapStatusIndicator } from '../ui/RoadmapStatusIndicator';

interface EpicQuestCardProps {
    epic: EpicQuest;
    onPress: () => void;
}

export function EpicQuestCard({ epic, onPress }: EpicQuestCardProps) {
    const { theme } = useTheme();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const fetchRoadmap = useFetchRoadmap();

    // Fetch milestone progress when roadmap is ready
    useEffect(() => {
        if (epic.roadmapStatus === 'ready') {
            loadMilestoneProgress();
        }
    }, [epic.questId, epic.roadmapStatus]);

    const loadMilestoneProgress = async () => {
        setIsLoadingProgress(true);
        try {
            const roadmapData = await fetchRoadmap(epic.questId, false); // Use cache if available
            setMilestones(roadmapData || []);
        } catch (error) {
            // Silently fail for progress loading
            console.warn('Failed to load milestone progress:', error);
        } finally {
            setIsLoadingProgress(false);
        }
    };

    const refreshProgress = async () => {
        if (epic.roadmapStatus === 'ready') {
            setIsLoadingProgress(true);
            try {
                const roadmapData = await fetchRoadmap(epic.questId, true); // Force refresh
                setMilestones(roadmapData || []);
            } catch (error) {
                console.warn('Failed to refresh milestone progress:', error);
            } finally {
                setIsLoadingProgress(false);
            }
        }
    };

    const getProgress = () => {
        if (milestones.length === 0) return { completed: 0, total: 0, percentage: 0 };
        const completed = milestones.filter(m => m.status === 'completed').length;
        const total = milestones.length;
        const percentage = Math.round((completed / total) * 100);
        return { completed, total, percentage };
    };

    const progress = getProgress();

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'wellness':
                return '#14b8a6';
            case 'fitness':
                return '#f97316';
            case 'learning':
                return '#8b5cf6';
            case 'creativity':
                return '#ec4899';
            case 'career':
                return '#3b82f6';
            case 'relationships':
                return '#ef4444';
            default:
                return '#64748b';
        }
    };

    const getRoadmapStatusIcon = (status: string) => {
        switch (status) {
            case 'generating':
                return <Loader size={16} color={theme.colors.ctaPrimary} />;
            case 'ready':
                return <CheckCircle size={16} color="#10b981" />;
            default:
                return <Clock size={16} color={theme.colors.subtitle} />;
        }
    };

    const getRoadmapStatusText = (status: string) => {
        switch (status) {
            case 'generating':
                return 'Generating roadmap...';
            case 'ready':
                return 'Roadmap ready';
            default:
                return 'No roadmap yet';
        }
    };

    const isCompleted = epic.status === 'completed';

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    shadowColor: theme.colors.text,
                    opacity: isCompleted ? 0.8 : 1,
                },
            ]}
            activeOpacity={0.7}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Map size={24} color={getCategoryColor(epic.category || '')} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                        {epic.title}
                    </Text>
                    <Text
                        style={[
                            styles.category,
                            { color: getCategoryColor(epic.category || '') },
                        ]}
                    >
                        {epic.category}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text style={[styles.description, { color: theme.colors.subtitle }]} numberOfLines={3}>
                {epic.description}
            </Text>

            {/* Status and Roadmap Info */}
            <View style={styles.footer}>
                <View style={styles.statusContainer}>
                    <View style={styles.statusRow}>
                        <Text style={[styles.status, { color: theme.colors.ctaPrimary }]}>
                            {epic.status} •
                        </Text>
                        <RoadmapStatusIndicator
                            status={epic.roadmapStatus || 'none'}
                            compact={true}
                        />
                    </View>
                    {epic.targetDate && (
                        <Text style={[styles.targetDate, { color: theme.colors.subtitle }]}>
                            Target: {new Date(epic.targetDate).toLocaleDateString()}
                        </Text>
                    )}
                </View>

                {/* Progress Bar */}
                {epic.roadmapStatus === 'ready' && progress.total > 0 && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <Text style={[styles.progressText, { color: theme.colors.subtitle }]}>
                                {progress.completed}/{progress.total} milestones completed
                            </Text>
                            <Text style={[styles.progressPercentage, { color: theme.colors.ctaPrimary }]}>
                                {progress.percentage}%
                            </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress.percentage}%`,
                                        backgroundColor: progress.percentage === 100 ? '#10b981' : theme.colors.ctaPrimary,
                                    }
                                ]}
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Dynamic Tap Instruction */}
            <View style={styles.tapHint}>
                <Text style={[styles.tapHintText, { color: theme.colors.subtitle }]}>
                    {epic.roadmapStatus === 'ready'
                        ? 'Tap to view roadmap'
                        : epic.roadmapStatus === 'generating'
                            ? 'Tap to check progress'
                            : 'Tap to generate roadmap'
                    }
                </Text>
                <ArrowRight size={16} color={theme.colors.subtitle} />
            </View>

            {/* Completed Overlay */}
            {isCompleted && (
                <View style={styles.completedOverlay}>
                    <CheckCircle size={32} color="#10b981" />
                    <Text style={styles.completedText}>Completed!</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        position: 'relative',
        transform: [{ scale: 1 }], // Hint for press animations
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 24,
    },
    category: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'column',
        gap: 12,
    },
    statusContainer: {
        flex: 1,
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    targetDate: {
        fontSize: 13,
        marginTop: 4,
    },
    roadmapSection: {
        gap: 8,
    },
    roadmapStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roadmapText: {
        fontSize: 12,
        fontWeight: '500',
    },
    refreshButton: {
        padding: 4,
        marginLeft: 4,
    },
    progressSection: {
        gap: 6,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: 'bold',
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
    completedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    tapHint: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tapHintText: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.7,
    },
    completedText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
    },
});
