import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface SimpleGreetingHeaderProps {
    userName: string;
    completionRate: number;
}

export function SimpleGreetingHeader({
    userName,
    completionRate,
}: SimpleGreetingHeaderProps) {
    const { theme } = useTheme();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.textSection}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>
                    {getGreeting()}, {userName}!
                </Text>
                <Text style={[styles.date, { color: theme.colors.subtitle }]}>
                    {getDate()}
                </Text>
            </View>

            {completionRate > 0 && (
                <View style={styles.progressSection}>
                    <Text style={[styles.progressLabel, { color: theme.colors.subtitle }]}>
                        Today&apos;s Progress
                    </Text>
                    <Text style={[styles.progressValue, { color: theme.colors.ctaPrimary }]}>
                        {Math.round(completionRate)}%
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    textSection: {
        flex: 1,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    date: {
        fontSize: 16,
    },
    progressSection: {
        alignItems: 'flex-end',
    },
    progressLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    progressValue: {
        fontSize: 20,
        fontWeight: '700',
    },
});
