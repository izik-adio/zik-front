import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { EpicQuest, Milestone } from '../../src/api/quests';
import { useEpicQuests, getTaskGoalStoreActions, useActiveRoadmap } from '../../src/store/questStore';
import { RoadmapVisualizer } from '../../components/quests/RoadmapVisualizer';
import { RoadmapStatusIndicator } from '../../components/ui/RoadmapStatusIndicator';
import { showAlert } from '../../utils/showAlert';

export default function EpicRoadmapScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const epicQuests = useEpicQuests();
    const activeRoadmap = useActiveRoadmap();
    const actions = getTaskGoalStoreActions();
    const { fetchRoadmap, generateRoadmap } = actions;

    // Find the epic quest from the store
    const epic = epicQuests.find((quest: EpicQuest) => quest.questId === id);

    useEffect(() => {
        if (id && user) {
            // Check if we already have roadmap data for this epic
            if (activeRoadmap?.epicQuestId === id && activeRoadmap.milestones.length > 0) {
                setMilestones(activeRoadmap.milestones);
                setIsLoading(false);
            } else {
                loadRoadmap();
            }
        }
    }, [id, user, activeRoadmap]);

    const loadRoadmap = async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const roadmapData = await fetchRoadmap(id);
            setMilestones(roadmapData || []);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load roadmap');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateRoadmap = async () => {
        if (!id) return;

        try {
            await generateRoadmap(id);
            showAlert(
                'Roadmap Generation Started',
                'AI is creating your personalized journey plan. This may take a few moments.',
                [{ text: 'OK' }]
            );

            // Start polling for completion
            actions.pollRoadmapGeneration(id);
        } catch (error) {
            showAlert(
                'Error',
                error instanceof Error ? error.message : 'Failed to generate roadmap'
            );
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleDeleteEpic = async () => {
        if (!id || !epic) return;

        showAlert(
            'Delete Epic Quest',
            `Are you sure you want to delete "${epic.title}"? This will permanently remove this goal and all its roadmap data.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await actions.deleteEpicQuest(id);
                            showAlert(
                                'Epic Quest Deleted',
                                'Your epic quest has been successfully deleted.',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            showAlert(
                                'Error',
                                error instanceof Error ? error.message : 'Failed to delete epic quest'
                            );
                        }
                    },
                },
            ]
        );
    };

    if (!epic) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                        Epic Quest not found
                    </Text>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Text style={[styles.backButtonText, { color: theme.colors.ctaPrimary }]}>
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {epic.title}
                    </Text>
                    <View style={styles.headerStatus}>
                        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
                            Epic Quest Roadmap
                        </Text>
                        <RoadmapStatusIndicator
                            status={epic.roadmapStatus || 'none'}
                            compact={false}
                        />
                    </View>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <Text style={[styles.loadingText, { color: theme.colors.subtitle }]}>
                            Loading your journey...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>
                            {error}
                        </Text>
                        <TouchableOpacity onPress={loadRoadmap} style={styles.retryButton}>
                            <Text style={[styles.retryButtonText, { color: theme.colors.ctaPrimary }]}>
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : milestones.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Sparkles size={48} color={theme.colors.ctaPrimary} style={styles.icon} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            {epic?.roadmapStatus === 'ready' ? 'Roadmap Loading...' : 'No Roadmap Yet'}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: theme.colors.subtitle }]}>
                            {epic?.roadmapStatus === 'ready'
                                ? 'Your roadmap is ready but still loading. If this persists, try refreshing.'
                                : "Let's create your personalized journey plan to achieve this epic quest!"
                            }
                        </Text>
                        {epic?.roadmapStatus === 'ready' ? (
                            <TouchableOpacity
                                onPress={loadRoadmap}
                                style={[styles.generateButton, { backgroundColor: theme.colors.ctaPrimary }]}
                            >
                                <Text style={styles.generateButtonText}>Refresh Roadmap</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handleGenerateRoadmap}
                                style={[styles.generateButton, { backgroundColor: theme.colors.ctaPrimary }]}
                            >
                                <Sparkles size={20} color="#FFFFFF" />
                                <Text style={styles.generateButtonText}>Generate My Roadmap</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.roadmapContainer}>
                        <RoadmapVisualizer milestones={milestones} />
                    </View>
                )}

                {/* Delete Button at the bottom */}
                <View style={styles.dangerZone}>
                    <TouchableOpacity
                        onPress={handleDeleteEpic}
                        style={[styles.deleteButton, { borderColor: theme.colors.error }]}
                    >
                        <Trash2 size={20} color={theme.colors.error} />
                        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
                            Delete Epic Quest
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerStatus: {
        alignItems: 'center',
        gap: 8,
    },
    headerSpacer: {
        width: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 2,
    },
    content: {
        flexGrow: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        fontSize: 16,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        padding: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    icon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    roadmapContainer: {
        flex: 1,
    },
    dangerZone: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(239, 68, 68, 0.2)',
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderWidth: 2,
        borderRadius: 12,
        gap: 8,
        backgroundColor: 'transparent',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
