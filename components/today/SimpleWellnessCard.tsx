import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { WellnessBreakModal } from './WellnessBreakModal';

export function SimpleWellnessCard() {
    const { theme } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
    const [customTime, setCustomTime] = useState(5); // Track minutes for adjustment
    const [showModal, setShowModal] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsActive(false);
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
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (!isActive) {
            // Starting the wellness break - show modal
            setShowModal(true);
        }
        setIsActive(!isActive);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setIsActive(false);
        setTimeLeft(customTime * 60);
    };

    const handleReset = () => {
        setIsActive(false);
        setTimeLeft(customTime * 60);
    };

    // Time adjustment functions
    const increaseTime = () => {
        if (!isActive && customTime < 60) { // Max 60 minutes
            const newTime = customTime + 1;
            setCustomTime(newTime);
            setTimeLeft(newTime * 60);
        }
    };

    const decreaseTime = () => {
        if (!isActive && customTime > 1) { // Min 1 minute
            const newTime = customTime - 1;
            setCustomTime(newTime);
            setTimeLeft(newTime * 60);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.content}>
                {/* Wellness header */}
                <View style={styles.header}>
                    <Heart size={20} color={theme.colors.success} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Wellness Break
                    </Text>
                    {!isActive && (
                        <Text style={[styles.blockingNote, { color: theme.colors.warning || theme.colors.subtitle }]}>
                            🔒 Full focus mode
                        </Text>
                    )}
                </View>

                {/* Timer display with adjustment controls */}
                <View style={styles.timerSection}>
                    {/* Time adjustment - only show when timer is not active */}
                    {!isActive && (
                        <>
                            <View style={styles.timeAdjustment}>
                                <TouchableOpacity
                                    onPress={decreaseTime}
                                    style={[styles.adjustButton, { backgroundColor: theme.colors.border }]}
                                    disabled={customTime <= 1}
                                >
                                    <Minus size={16} color={customTime <= 1 ? theme.colors.border : theme.colors.subtitle} />
                                </TouchableOpacity>

                                <Text style={[styles.timeLabel, { color: theme.colors.subtitle }]}>
                                    {customTime} min
                                </Text>

                                <TouchableOpacity
                                    onPress={increaseTime}
                                    style={[styles.adjustButton, { backgroundColor: theme.colors.border }]}
                                    disabled={customTime >= 60}
                                >
                                    <Plus size={16} color={customTime >= 60 ? theme.colors.border : theme.colors.subtitle} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.description, { color: theme.colors.subtitle }]}>
                                Full-screen guided breathing break{'\n'}
                                The app will be blocked during this time
                            </Text>
                        </>
                    )}

                    <Text style={[styles.timerText, { color: theme.colors.ctaPrimary }]}>
                        {formatTime(timeLeft)}
                    </Text>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity
                            onPress={handleReset}
                            style={[styles.controlButton, { backgroundColor: theme.colors.border }]}
                        >
                            <RotateCcw size={16} color={theme.colors.subtitle} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={[styles.playButton, { backgroundColor: theme.colors.success }]}
                        >
                            {isActive ? (
                                <Pause size={20} color="#FFFFFF" />
                            ) : (
                                <Play size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Wellness Break Modal */}
            <WellnessBreakModal
                visible={showModal}
                onClose={handleModalClose}
                duration={customTime * 60}
            />
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
    content: {
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    blockingNote: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 'auto',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    timerSection: {
        alignItems: 'center',
        gap: 12,
    },
    timeAdjustment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    adjustButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '500',
        minWidth: 40,
        textAlign: 'center',
    },
    description: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 4,
    },
    timerText: {
        fontSize: 28,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
