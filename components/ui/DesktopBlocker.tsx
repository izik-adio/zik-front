import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MOBILE_BREAKPOINT = 768;

interface DesktopBlockerProps {
    children: React.ReactNode;
}

export function DesktopBlocker({ children }: DesktopBlockerProps) {
    const [screenData, setScreenData] = useState(Dimensions.get('window'));
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const onChange = (result: { window: any }) => {
            setScreenData(result.window);
        };

        const subscription = Dimensions.addEventListener('change', onChange);
        return () => subscription?.remove();
    }, []);

    useEffect(() => {
        const checkIfDesktop = () => {
            if (Platform.OS === 'web') {
                const { width } = screenData;
                const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

                // Check if screen width is larger than mobile breakpoint
                const isWideScreen = width >= MOBILE_BREAKPOINT;

                // Check if user agent suggests desktop
                const isDesktopUA = /Windows|Macintosh|Linux/.test(userAgent) &&
                    !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

                setIsDesktop(isWideScreen && isDesktopUA);
            } else {
                setIsDesktop(false);
            }
        };

        checkIfDesktop();
    }, [screenData]);

    if (isDesktop) {
        return (
            <View style={styles.rootContainer}>
                {children}
                <View style={styles.overlay}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.gradient}
                    >
                        <View style={styles.content}>
                            <Text style={styles.icon}>📱</Text>
                            <Text style={styles.title}>Mobile Experience Only</Text>
                            <Text style={styles.subtitle}>
                                Zik is optimized exclusively for mobile devices
                            </Text>
                            <Text style={styles.description}>
                                For the best experience, please access Zik using one of the options below:
                            </Text>
                            <View style={styles.instructionsContainer}>
                                <Text style={styles.instructionsTitle}>Access Options:</Text>
                                <Text style={styles.instruction}>📱 Open this link on your phone browser</Text>
                                <Text style={styles.instruction}>🔗 Copy the URL and paste it on your mobile device</Text>
                                <Text style={styles.instruction}>📏 Resize your browser window to mobile size</Text>
                                <Text style={styles.instruction}>📲 Download from App Store/Play Store (Coming Soon!)</Text>
                            </View>
                            <View style={styles.comingSoonContainer}>
                                <Text style={styles.comingSoonText}>
                                    🚀 Native mobile app launching very soon on App Store and Google Play Store!
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        width: '100%',
        ...(Platform.OS === 'web' && { height: '100vh' as any }),
    } as ViewStyle,
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    } as ViewStyle,
    container: {
        flex: 1,
        width: '100%',
        ...(Platform.OS === 'web' && { height: '100vh' as any }),
    } as ViewStyle,
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    } as ViewStyle,
    content: {
        alignItems: 'center',
        maxWidth: 400,
        ...(Platform.OS === 'web' && { textAlign: 'center' as any }),
    } as ViewStyle,
    icon: {
        fontSize: 80,
        marginBottom: 20,
    } as TextStyle,
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        fontFamily: 'Inter-Bold',
    } as TextStyle,
    subtitle: {
        fontSize: 18,
        color: '#e0e0e0',
        marginBottom: 20,
        fontFamily: 'Inter-Medium',
    } as TextStyle,
    description: {
        fontSize: 16,
        color: '#d0d0d0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
        fontFamily: 'Inter-Regular',
    } as TextStyle,
    instructionsContainer: {
        alignItems: 'flex-start',
        width: '100%',
    } as ViewStyle,
    instructionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 15,
        fontFamily: 'Inter-SemiBold',
    } as TextStyle,
    instruction: {
        fontSize: 16,
        color: '#e0e0e0',
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
    } as TextStyle,
    comingSoonContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        width: '100%',
    } as ViewStyle,
    comingSoonText: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
        fontFamily: 'Inter-Medium',
        lineHeight: 20,
    } as TextStyle,
});
