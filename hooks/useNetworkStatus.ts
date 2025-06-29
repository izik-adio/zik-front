import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useChatStore } from '../src/store/chatStore';
import { useToast } from '../components/ui/Toast';

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionType, setConnectionType] = useState<string | null>('wifi');
    const { setOnlineStatus } = useChatStore();
    const { showToast } = useToast();

    useEffect(() => {
        const checkConnection = async () => {
            try {
                let connected = false;

                if (Platform.OS === 'web') {
                    // Use Navigator API for web platforms
                    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
                        connected = navigator.onLine;

                        // Additional check: try to reach our own API to verify real connectivity
                        if (connected) {
                            try {
                                // Use a simple request to check connectivity with our own API
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 3000);

                                // Try to reach our API base URL with a lightweight request
                                const response = await fetch('https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com/', {
                                    method: 'HEAD',
                                    signal: controller.signal,
                                    cache: 'no-cache',
                                    mode: 'no-cors'  // This allows the request to succeed even if CORS is not configured
                                });

                                clearTimeout(timeoutId);
                                // For no-cors mode, we can't check response.ok, so we assume success if no error
                                connected = true;
                            } catch (error) {
                                // If our API is not reachable, still trust navigator.onLine
                                // This prevents false negatives when API is down but internet works
                                console.log('API connectivity check failed, using navigator.onLine status:', error);
                            }
                        }
                    } else {
                        // Fallback for older browsers - assume connected
                        connected = true;
                    }
                } else {
                    // For mobile platforms, use the original fetch approach
                    const response = await fetch('https://www.google.com/favicon.ico', {
                        method: 'HEAD',
                        cache: 'no-cache',
                    });
                    connected = response.ok;
                }

                const wasConnected = isConnected;
                setIsConnected(connected);
                setOnlineStatus(connected);

                // Show notifications for status changes
                if (wasConnected && !connected) {
                    showToast({
                        type: 'offline',
                        title: 'Offline',
                        message: 'You\'re offline. Your messages will be saved and synced when you reconnect.',
                        duration: 4000,
                    });
                } else if (!wasConnected && connected) {
                    showToast({
                        type: 'online',
                        title: 'Back online',
                        message: 'Connection restored. Syncing your conversations...',
                        duration: 3000,
                    });
                }
            } catch (error) {
                console.error('Network check error:', error);
                if (isConnected) {
                    setIsConnected(false);
                    setOnlineStatus(false);
                    showToast({
                        type: 'offline',
                        title: 'Connection lost',
                        message: 'Unable to connect to the internet.',
                        duration: 4000,
                    });
                }
            }
        };

        // Web-specific event listeners for better network detection
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleOnline = () => {
                console.log('Browser detected online');
                checkConnection();
            };

            const handleOffline = () => {
                console.log('Browser detected offline');
                setIsConnected(false);
                setOnlineStatus(false);
                showToast({
                    type: 'offline',
                    title: 'Offline',
                    message: 'You\'re offline. Your messages will be saved and synced when you reconnect.',
                    duration: 4000,
                });
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            // Cleanup function for web events
            const cleanup = () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };

            // Check immediately
            checkConnection();

            // Check every 30 seconds
            const interval = setInterval(checkConnection, 30000);

            return () => {
                cleanup();
                clearInterval(interval);
            };
        } else {
            // For mobile platforms, use the original approach
            checkConnection();
            const interval = setInterval(checkConnection, 30000);
            return () => clearInterval(interval);
        }
    }, [isConnected, setOnlineStatus, showToast]);

    return {
        isConnected,
        connectionType,
    };
}
