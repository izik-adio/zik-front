import { useEffect, useState } from 'react';
import { useChatStore } from '../src/store/chatStore';
import { useToast } from '../components/ui/Toast';

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionType, setConnectionType] = useState<string | null>('wifi');
    const { setOnlineStatus } = useChatStore();
    const { showToast } = useToast();

    useEffect(() => {
        // Simple network status monitoring
        // In a real app, you'd use @react-native-community/netinfo
        const checkConnection = async () => {
            try {
                const response = await fetch('https://www.google.com/favicon.ico', {
                    method: 'HEAD',
                    cache: 'no-cache',
                });
                const connected = response.ok;
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

        // Check immediately
        checkConnection();

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000);

        return () => clearInterval(interval);
    }, [isConnected, setOnlineStatus, showToast]);

    return {
        isConnected,
        connectionType,
    };
}
