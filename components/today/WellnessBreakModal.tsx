import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    BackHandler,
    Vibration,
    Platform,
} from 'react-native';
import { Heart, X, Pause, Play } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { SoundGenerator } from '@/src/utils/soundGenerator';

interface WellnessBreakModalProps {
    visible: boolean;
    onClose: () => void;
    duration: number; // Duration in seconds
}

export function WellnessBreakModal({ visible, onClose, duration }: WellnessBreakModalProps) {
    const { theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isPaused, setIsPaused] = useState(false);
    const [isBreathing, setIsBreathing] = useState(true);
    const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const breatheAnimation = useRef(new Animated.Value(1)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const breathingLoopRef = useRef<any>(null);
    const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Breathing animation cycle - continuous loop
    const startBreathingAnimation = () => {
        // Stop any existing animation
        if (breathingLoopRef.current) {
            breathingLoopRef.current.stop();
        }

        // Start the phase tracking
        startPhaseTracking();

        // Create a looping breathing animation
        breathingLoopRef.current = Animated.loop(
            Animated.sequence([
                // Breathe in (expand)
                Animated.timing(breatheAnimation, {
                    toValue: 1.3,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                // Hold
                Animated.timing(breatheAnimation, {
                    toValue: 1.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                // Breathe out (contract)
                Animated.timing(breatheAnimation, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                // Hold
                Animated.timing(breatheAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        breathingLoopRef.current.start();
    };

    // Start phase tracking to sync text with animation
    const startPhaseTracking = () => {
        // Stop any existing phase timer
        if (phaseTimerRef.current) {
            clearInterval(phaseTimerRef.current);
        }

        // Reset to inhale phase
        setBreathingPhase('inhale');
        let phaseTimeElapsed = 0;

        phaseTimerRef.current = setInterval(() => {
            phaseTimeElapsed += 100; // Update every 100ms for smooth transitions

            const cycleTime = phaseTimeElapsed % 10000; // 10 second cycle

            if (cycleTime < 4000) {
                setBreathingPhase('inhale');
            } else if (cycleTime < 5000) {
                setBreathingPhase('hold-in');
            } else if (cycleTime < 9000) {
                setBreathingPhase('exhale');
            } else {
                setBreathingPhase('hold-out');
            }
        }, 100);
    };

    // Stop phase tracking
    const stopPhaseTracking = () => {
        if (phaseTimerRef.current) {
            clearInterval(phaseTimerRef.current);
            phaseTimerRef.current = null;
        }
    };

    // Stop breathing animation
    const stopBreathingAnimation = () => {
        if (breathingLoopRef.current) {
            breathingLoopRef.current.stop();
            breathingLoopRef.current = null;
        }
        stopPhaseTracking();
        // Reset to normal size
        Animated.timing(breatheAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    // Gentle pulse animation
    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Load and play completion sound
    const playCompletionSound = async () => {
        try {
            // Play completion beeps using our sound generator
            await SoundGenerator.playCompletionBeeps();

            // Primary notification: Strong vibration pattern
            if (Platform.OS !== 'web') {
                // Create a gentle bell-like vibration pattern
                Vibration.vibrate([200, 100, 200, 100, 400, 200, 200]);
            }

        } catch (error) {
            console.log('Error with notification:', error);
            // Final fallback to simple vibration
            if (Platform.OS !== 'web') {
                Vibration.vibrate(1000);
            }
        }
    };

    // Timer logic
    useEffect(() => {
        if (visible && !isPaused && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsBreathing(false);
                        stopBreathingAnimation();
                        playCompletionSound();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [visible, isPaused, timeLeft]);

    // Start animations when modal opens
    useEffect(() => {
        if (visible) {
            setTimeLeft(duration);
            setIsPaused(false);
            setIsBreathing(true);
            setBreathingPhase('inhale');
            startBreathingAnimation();
        } else {
            setIsBreathing(false);
            stopBreathingAnimation();
            breatheAnimation.setValue(1);
            pulseAnimation.setValue(1);
            // Stop pulse animation if running
            pulseAnimation.stopAnimation();
        }

        // Cleanup on unmount or when modal closes
        return () => {
            stopBreathingAnimation();
            pulseAnimation.stopAnimation();
        };
    }, [visible, duration]);

    // Prevent back button from closing modal
    useEffect(() => {
        if (visible) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                // Block back button during wellness break
                return true;
            });
            return () => backHandler.remove();
        }
    }, [visible]);

    // Cleanup animations
    useEffect(() => {
        return () => {
            stopBreathingAnimation();
            pulseAnimation.stopAnimation();
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
        if (isPaused) {
            // Resuming - start breathing animation
            setIsBreathing(true);
            startBreathingAnimation();
        } else {
            // Pausing - stop breathing animation and start gentle pulse
            setIsBreathing(false);
            stopBreathingAnimation();
            setBreathingPhase('inhale'); // Reset phase when paused
            startPulseAnimation();
        }
    };

    const getBreathingText = () => {
        if (timeLeft === 0) return "Wellness break complete! 🌟";
        if (isPaused) return "Paused - Resume when ready";
        return "Focus on your breath and relax";
    };

    const getBreathingInstruction = () => {
        if (timeLeft === 0) return "You can now return to your tasks refreshed";
        if (isPaused) return "Take your time";

        // Use the synchronized breathing phase
        switch (breathingPhase) {
            case 'inhale':
                return "Breathe in slowly...";
            case 'hold-in':
                return "Hold...";
            case 'exhale':
                return "Breathe out slowly...";
            case 'hold-out':
                return "Hold...";
            default:
                return "Breathe in slowly...";
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            statusBarTranslucent
            onRequestClose={() => {
                // Only allow closing when break is complete
                if (timeLeft === 0) {
                    onClose();
                }
            }}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header with close button (only visible when complete) */}
                {timeLeft === 0 && (
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Main content */}
                <View style={styles.content}>
                    {/* Breathing circle */}
                    <View style={styles.breathingContainer}>
                        <Animated.View
                            style={[
                                styles.breathingCircle,
                                {
                                    backgroundColor: theme.colors.success + '20',
                                    borderColor: theme.colors.success,
                                    transform: [
                                        { scale: isPaused ? pulseAnimation : breatheAnimation }
                                    ],
                                },
                            ]}
                        >
                            <Heart size={40} color={theme.colors.success} />
                        </Animated.View>
                    </View>

                    {/* Timer */}
                    <Text style={[styles.timerText, { color: theme.colors.ctaPrimary }]}>
                        {formatTime(timeLeft)}
                    </Text>

                    {/* Main instruction */}
                    <Text style={[styles.mainText, { color: theme.colors.text }]}>
                        {getBreathingText()}
                    </Text>

                    {/* Breathing instruction */}
                    <Text style={[styles.instructionText, { color: theme.colors.subtitle }]}>
                        {getBreathingInstruction()}
                    </Text>

                    {/* Control button (only show pause/resume when active) */}
                    {timeLeft > 0 && (
                        <TouchableOpacity
                            onPress={handlePauseResume}
                            style={[styles.controlButton, { backgroundColor: theme.colors.ctaPrimary }]}
                        >
                            {isPaused ? (
                                <Play size={24} color="#FFFFFF" />
                            ) : (
                                <Pause size={24} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Completion message */}
                    {timeLeft === 0 && (
                        <View style={styles.completionContainer}>
                            <Text style={[styles.completionText, { color: theme.colors.success }]}>
                                🎉 Great job taking care of yourself!
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.doneButton, { backgroundColor: theme.colors.success }]}
                            >
                                <Text style={styles.doneButtonText}>Continue Your Journey</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Bottom instruction text */}
                    {timeLeft > 0 && (
                        <Text style={[styles.bottomText, { color: theme.colors.subtitle }]}>
                            This wellness break cannot be skipped.{'\n'}
                            Focus on your breath and relax.
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 24,
    },
    breathingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    breathingCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    timerText: {
        fontSize: 36,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    mainText: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 32,
    },
    instructionText: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 24,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    completionContainer: {
        alignItems: 'center',
        gap: 16,
    },
    completionText: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    doneButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 20,
        maxWidth: 280,
    },
});
