import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

function SkeletonItem({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const { theme } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            false
        );
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.border,
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

export function ChatMessageSkeleton() {
    return (
        <View style={styles.chatSkeletonContainer}>
            {/* User message skeleton */}
            <View style={styles.userMessageSkeleton}>
                <SkeletonItem width="70%" height={40} borderRadius={20} />
            </View>

            {/* AI message skeleton */}
            <View style={styles.aiMessageSkeleton}>
                <SkeletonItem width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
                <View style={styles.aiMessageContent}>
                    <SkeletonItem width="90%" height={16} style={{ marginBottom: 8 }} />
                    <SkeletonItem width="75%" height={16} style={{ marginBottom: 8 }} />
                    <SkeletonItem width="50%" height={16} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
    },
    chatSkeletonContainer: {
        padding: 16,
        gap: 16,
    },
    userMessageSkeleton: {
        alignItems: 'flex-end',
    },
    aiMessageSkeleton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    aiMessageContent: {
        flex: 1,
    },
});
