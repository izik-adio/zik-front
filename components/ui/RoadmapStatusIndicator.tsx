import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

interface RoadmapStatusIndicatorProps {
    status: 'none' | 'generating' | 'ready' | 'error';
    compact?: boolean;
}

export function RoadmapStatusIndicator({ status, compact = false }: RoadmapStatusIndicatorProps) {
    const { theme } = useTheme();
    const rotationAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (status === 'generating') {
            // Start rotation animation
            const rotate = Animated.loop(
                Animated.timing(rotationAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            );
            rotate.start();

            return () => rotate.stop();
        }
    }, [status, rotationAnim]);

    const getStatusConfig = () => {
        switch (status) {
            case 'generating':
                return {
                    icon: <Loader size={compact ? 14 : 16} color={theme.colors.ctaPrimary} />,
                    text: compact ? 'AI creating...' : 'AI is creating your roadmap...',
                    color: theme.colors.ctaPrimary,
                    backgroundColor: theme.colors.ctaPrimary + '20',
                };
            case 'ready':
                return {
                    icon: <CheckCircle size={compact ? 14 : 16} color="#10b981" />,
                    text: compact ? 'Ready' : 'Roadmap ready',
                    color: '#10b981',
                    backgroundColor: '#10b981' + '20',
                };
            case 'error':
                return {
                    icon: <AlertCircle size={compact ? 14 : 16} color={theme.colors.error} />,
                    text: compact ? 'Error' : 'Generation failed',
                    color: theme.colors.error,
                    backgroundColor: theme.colors.error + '20',
                };
            default:
                return {
                    icon: <Clock size={compact ? 14 : 16} color={theme.colors.subtitle} />,
                    text: compact ? 'No roadmap' : 'No roadmap yet',
                    color: theme.colors.subtitle,
                    backgroundColor: theme.colors.subtitle + '20',
                };
        }
    };

    const config = getStatusConfig();

    const animatedRotation = rotationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View
            style={[
                styles.container,
                compact ? styles.compactContainer : styles.fullContainer,
                { backgroundColor: config.backgroundColor }
            ]}
        >
            <Animated.View
                style={[
                    styles.iconContainer,
                    status === 'generating' && { transform: [{ rotate: animatedRotation }] }
                ]}
            >
                {config.icon}
            </Animated.View>
            <Text
                style={[
                    styles.text,
                    compact ? styles.compactText : styles.fullText,
                    { color: config.color }
                ]}
            >
                {config.text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    compactContainer: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    fullContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    iconContainer: {
        marginRight: 6,
    },
    text: {
        fontWeight: '500',
    },
    compactText: {
        fontSize: 12,
    },
    fullText: {
        fontSize: 14,
    },
});
