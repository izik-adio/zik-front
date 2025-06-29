import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'online';

interface ToastProps {
    visible: boolean;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onHide: () => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        color: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    error: {
        icon: XCircle,
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    warning: {
        icon: AlertCircle,
        color: '#F59E0B',
        backgroundColor: '#FFFBEB',
    },
    info: {
        icon: Info,
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    offline: {
        icon: WifiOff,
        color: '#6B7280',
        backgroundColor: '#F9FAFB',
    },
    online: {
        icon: Wifi,
        color: '#10B981',
        backgroundColor: '#F0FDF4',
    },
};

export function Toast({ visible, type, title, message, duration = 3000, onHide }: ToastProps) {
    const { theme } = useTheme();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    const config = toastConfig[type];
    const IconComponent = config.icon;

    useEffect(() => {
        if (visible) {
            // Show toast
            opacity.value = withSpring(1);
            translateY.value = withSpring(0);

            // Auto hide after duration
            const timer = setTimeout(() => {
                opacity.value = withSpring(0);
                translateY.value = withSpring(-100, {}, (finished) => {
                    if (finished) {
                        runOnJS(onHide)();
                    }
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration, onHide, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[
            styles.container,
            {
                backgroundColor: config.backgroundColor,
                borderColor: config.color,
            },
            animatedStyle,
        ]}
        >
            <View style={styles.content}>
                <IconComponent size={20} color={config.color} />
                <View style={styles.textContainer}>
                    <Text
                        style={[
                            styles.title,
                            { color: theme.colors.text },
                        ]}
                    >
                        {title}
                    </Text>
                    {message && (
                        <Text
                            style={[
                                styles.message,
                                { color: theme.colors.subtitle },
                            ]}
                        >
                            {message}
                        </Text>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}

// Toast manager for multiple toasts
interface ToastItem extends ToastProps {
    id: string;
}

interface ToastManagerState {
    toasts: ToastItem[];
}

class ToastManager {
    private listeners: ((state: ToastManagerState) => void)[] = [];
    private state: ToastManagerState = { toasts: [] };

    subscribe(listener: (state: ToastManagerState) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    show(options: Omit<ToastProps, 'visible' | 'onHide'>) {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const toast: ToastItem = {
            ...options,
            id,
            visible: true,
            onHide: () => this.hide(id),
        };

        this.state.toasts.push(toast);
        this.notify();

        return id;
    }

    hide(id: string) {
        this.state.toasts = this.state.toasts.filter(toast => toast.id !== id);
        this.notify();
    }

    clear() {
        this.state.toasts = [];
        this.notify();
    }
}

export const toastManager = new ToastManager();

// Hook to use toast manager
export function useToast() {
    const [state, setState] = React.useState<ToastManagerState>({ toasts: [] });

    React.useEffect(() => {
        return toastManager.subscribe(setState);
    }, []);

    const showToast = React.useCallback((options: Omit<ToastProps, 'visible' | 'onHide'>) => {
        return toastManager.show(options);
    }, []);

    const hideToast = React.useCallback((id: string) => {
        toastManager.hide(id);
    }, []);

    const clearAllToasts = React.useCallback(() => {
        toastManager.clear();
    }, []);

    return {
        toasts: state.toasts,
        showToast,
        hideToast,
        clearAllToasts,
    };
}

// Toast container component
export function ToastContainer() {
    const { toasts } = useToast();

    return (
        <View style={styles.toastContainer} pointerEvents="none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'none',
    },
    container: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        lineHeight: 18,
    },
    message: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        lineHeight: 16,
        marginTop: 4,
    },
});
