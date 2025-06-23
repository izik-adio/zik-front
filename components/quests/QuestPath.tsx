import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/src/context/ThemeContext';

interface QuestPathProps {
  quests: {
    id: string;
    title: string;
    progress: number;
  }[];
}

export function QuestPath({ quests }: QuestPathProps) {
  const { theme } = useTheme();

  const getCircleColor = (progress: number) => {
    if (progress === 100) return theme.colors.success;
    if (progress > 0) return theme.colors.ctaPrimary;
    return theme.colors.border;
  };

  return (
    <View style={styles.container}>
      <Svg width="100%" height="120" viewBox="0 0 300 120">
        {/* Quest path */}
        <Path
          d="M30 60 Q75 30 120 60 T210 60 T300 60"
          stroke={theme.colors.border}
          strokeWidth="4"
          fill="none"
        />

        {/* Quest nodes */}
        {quests.slice(0, 4).map((quest, index) => {
          const x = 30 + index * 90;
          const y = index % 2 === 0 ? 60 : 45;

          return (
            <Circle
              key={quest.id}
              cx={x}
              cy={y}
              r="12"
              fill={getCircleColor(quest.progress)}
              stroke={theme.colors.card}
              strokeWidth="3"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
});
