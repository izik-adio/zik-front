import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import { CheckCircle, Lock, Play, Clock } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Milestone } from '../../src/api/quests';

interface RoadmapVisualizerProps {
    milestones: Milestone[];
    onMilestonePress?: (milestone: Milestone) => void;
}

export function RoadmapVisualizer({ milestones, onMilestonePress }: RoadmapVisualizerProps) {
    const { theme } = useTheme();
    const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
    const screenWidth = Dimensions.get('window').width;
    const pathWidth = screenWidth - 40;

    // Animation values
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useSharedValue(0);

    const getMilestoneColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10b981'; // Green
            case 'active':
                return theme.colors.ctaPrimary; // Primary blue
            case 'locked':
            default:
                return '#9ca3af'; // Gray
        }
    };

    const getMilestoneIcon = (status: string, size: number = 20) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={size} color="#10b981" />;
            case 'active':
                return <Play size={size} color={theme.colors.ctaPrimary} />;
            case 'locked':
            default:
                return <Lock size={size} color="#9ca3af" />;
        }
    };

    const handleMilestonePress = (milestone: Milestone) => {
        setSelectedMilestone(milestone.milestoneId);

        // Trigger pulse animation
        pulseAnimation.value = withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
        );

        onMilestonePress?.(milestone);
    };

    const getPathPointY = (index: number, totalMilestones: number) => {
        // Create a wavy path
        const baseY = 60;
        const amplitude = 25;
        const frequency = 2;
        return baseY + amplitude * Math.sin((index / (totalMilestones - 1)) * frequency * Math.PI);
    };

    const generatePath = () => {
        if (milestones.length < 2) return '';

        const points = milestones.map((_, index) => ({
            x: (index / (milestones.length - 1)) * (pathWidth - 60) + 30,
            y: getPathPointY(index, milestones.length)
        }));

        let pathString = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            const controlPointX = (prevPoint.x + currentPoint.x) / 2;

            pathString += ` Q ${controlPointX} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`;
        }

        return pathString;
    };

    const getMilestonePosition = (index: number) => {
        return {
            x: (index / (milestones.length - 1)) * (pathWidth - 60) + 30,
            y: getPathPointY(index, milestones.length)
        };
    };

    if (milestones.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Clock size={48} color={theme.colors.subtitle} />
                <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>
                    No milestones available
                </Text>
            </View>
        );
    }

    const svgHeight = Math.max(120, Math.max(...milestones.map((_, i) => getPathPointY(i, milestones.length))) + 40);

    return (
        <View style={styles.container}>
            {/* SVG Path */}
            <View style={styles.svgContainer}>
                <Svg width={pathWidth} height={svgHeight} viewBox={`0 0 ${pathWidth} ${svgHeight}`}>
                    {/* Journey Path */}
                    {milestones.length > 1 && (
                        <Path
                            d={generatePath()}
                            stroke={theme.colors.border}
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray="8,4"
                        />
                    )}

                    {/* Milestone Nodes */}
                    {milestones.map((milestone, index) => {
                        const position = getMilestonePosition(index);
                        const isSelected = selectedMilestone === milestone.milestoneId;

                        return (
                            <Circle
                                key={milestone.milestoneId}
                                cx={position.x}
                                cy={position.y}
                                r={isSelected ? 18 : 15}
                                fill={getMilestoneColor(milestone.status)}
                                stroke={theme.colors.card}
                                strokeWidth="3"
                                onPress={() => handleMilestonePress(milestone)}
                            />
                        );
                    })}

                    {/* Milestone Numbers */}
                    {milestones.map((milestone, index) => {
                        const position = getMilestonePosition(index);

                        return (
                            <SvgText
                                key={`text-${milestone.milestoneId}`}
                                x={position.x}
                                y={position.y + 5}
                                fontSize="12"
                                fontWeight="bold"
                                fill="#FFFFFF"
                                textAnchor="middle"
                            >
                                {milestone.sequence}
                            </SvgText>
                        );
                    })}
                </Svg>
            </View>

            {/* Milestone Cards */}
            <View style={styles.milestonesContainer}>
                {milestones.map((milestone, index) => (
                    <TouchableOpacity
                        key={milestone.milestoneId}
                        style={[
                            styles.milestoneCard,
                            {
                                backgroundColor: theme.colors.card,
                                borderColor: selectedMilestone === milestone.milestoneId
                                    ? getMilestoneColor(milestone.status)
                                    : theme.colors.border,
                                borderWidth: selectedMilestone === milestone.milestoneId ? 2 : 1,
                            }
                        ]}
                        onPress={() => handleMilestonePress(milestone)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.milestoneHeader}>
                            <View style={styles.milestoneIconContainer}>
                                {getMilestoneIcon(milestone.status, 24)}
                            </View>
                            <View style={styles.milestoneTitleContainer}>
                                <Text style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                                    Milestone {milestone.sequence}
                                </Text>
                                <Text style={[styles.milestoneSubtitle, { color: getMilestoneColor(milestone.status) }]}>
                                    {milestone.title}
                                </Text>
                            </View>
                            <View style={styles.milestoneDuration}>
                                <Text style={[styles.durationText, { color: theme.colors.subtitle }]}>
                                    {milestone.durationInDays} days
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.milestoneDescription, { color: theme.colors.subtitle }]} numberOfLines={3}>
                            {milestone.description}
                        </Text>

                        <View style={[styles.statusBadge, { backgroundColor: getMilestoneColor(milestone.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getMilestoneColor(milestone.status) }]}>
                                {milestone.status.toUpperCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    svgContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
    },
    milestonesContainer: {
        paddingTop: 20,
    },
    milestoneCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    milestoneIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    milestoneTitleContainer: {
        flex: 1,
    },
    milestoneTitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    milestoneSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    milestoneDuration: {
        alignItems: 'flex-end',
    },
    durationText: {
        fontSize: 12,
        fontWeight: '500',
    },
    milestoneDescription: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
