import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Trophy, Sparkles, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Milestone } from '../../src/api/quests';

interface MilestoneCelebrationModalProps {
    visible: boolean;
    milestone: Milestone | null;
    nextMilestone: Milestone | null;
    onClose: () => void;
    onContinue?: () => void;
}

const { width, height } = Dimensions.get('window');

export function MilestoneCelebrationModal({
    visible,
    milestone,
    nextMilestone,
    onClose,
    onContinue,
}: MilestoneCelebrationModalProps) {
    const { theme } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            // Start animations
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 5,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(sparkleAnim, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(sparkleAnim, {
                            toValue: 0,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]).start();
        } else {
            // Reset animations
            scaleAnim.setValue(0);
            slideAnim.setValue(height);
            sparkleAnim.setValue(0);
        }
    }, [visible]);

    if (!milestone) return null;

    const handleContinue = () => {
        onContinue?.();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Sparkle Effects */}
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle1,
                        {
                            opacity: sparkleAnim,
                            transform: [{ scale: sparkleAnim }],
                        },
                    ]}
                >
                    <Sparkles size={24} color="#FFD700" />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle2,
                        {
                            opacity: sparkleAnim,
                            transform: [{ scale: sparkleAnim }],
                        },
                    ]}
                >
                    <Sparkles size={16} color="#FFA500" />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.sparkle,
                        styles.sparkle3,
                        {
                            opacity: sparkleAnim,
                            transform: [{ scale: sparkleAnim }],
                        },
                    ]}
                >
                    <Sparkles size={20} color="#FF69B4" />
                </Animated.View>

                {/* Main Content */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Trophy Animation */}
                    <Animated.View
                        style={[
                            styles.trophyContainer,
                            {
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.trophyCircle,
                                { backgroundColor: theme.colors.ctaPrimary },
                            ]}
                        >
                            <Trophy size={48} color="#FFFFFF" />
                        </View>
                    </Animated.View>

                    {/* Celebration Text */}
                    <Text style={[styles.celebrationTitle, { color: theme.colors.text }]}>
                        Milestone Completed! 🎉
                    </Text>

                    <Text style={[styles.milestoneTitle, { color: theme.colors.ctaPrimary }]}>
                        {milestone.title}
                    </Text>

                    {milestone.description && (
                        <Text style={[styles.milestoneDescription, { color: theme.colors.subtitle }]}>
                            {milestone.description}
                        </Text>
                    )}

                    {/* Progress Stats */}
                    <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.stat}>
                            <Text style={[styles.statNumber, { color: theme.colors.ctaPrimary }]}>
                                {milestone.sequence}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.subtitle }]}>
                                Milestone
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={[styles.statNumber, { color: theme.colors.ctaPrimary }]}>
                                {milestone.durationInDays}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.subtitle }]}>
                                Days
                            </Text>
                        </View>
                    </View>

                    {/* Next Milestone Preview */}
                    {nextMilestone && (
                        <View style={[styles.nextMilestone, { backgroundColor: theme.colors.ctaSecondary + '20' || theme.colors.card }]}>
                            <Text style={[styles.nextTitle, { color: theme.colors.text }]}>
                                Next Up:
                            </Text>
                            <Text style={[styles.nextMilestoneTitle, { color: theme.colors.ctaSecondary }]}>
                                {nextMilestone.title}
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[
                                styles.button,
                                styles.secondaryButton,
                                { borderColor: theme.colors.border },
                            ]}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                                Close
                            </Text>
                        </TouchableOpacity>

                        {nextMilestone && (
                            <TouchableOpacity
                                onPress={handleContinue}
                                style={[
                                    styles.button,
                                    styles.primaryButton,
                                    { backgroundColor: theme.colors.ctaPrimary },
                                ]}
                            >
                                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                    Continue Journey
                                </Text>
                                <ChevronRight size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: '20%',
        left: '10%',
    },
    sparkle2: {
        top: '30%',
        right: '15%',
    },
    sparkle3: {
        bottom: '25%',
        left: '20%',
    },
    content: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 25,
    },
    trophyContainer: {
        marginBottom: 24,
    },
    trophyCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    celebrationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    milestoneTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    milestoneDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    nextMilestone: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    nextTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    nextMilestoneTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    primaryButton: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    secondaryButton: {
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
