import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface QuestPathProps {
  quests: Array<{
    id: string;
    title: string;
    progress: number;
  }>;
}

export function QuestPath({ quests }: QuestPathProps) {
  const getPathColor = (progress: number) => {
    if (progress === 100) return '#14b8a6';
    if (progress > 0) return '#f97316';
    return '#e2e8f0';
  };

  const getCircleColor = (progress: number) => {
    if (progress === 100) return '#14b8a6';
    if (progress > 0) return '#f97316';
    return '#e2e8f0';
  };

  return (
    <View style={styles.container}>
      <Svg width="100%" height="120" viewBox="0 0 300 120">
        {/* Quest path */}
        <Path
          d="M30 60 Q75 30 120 60 T210 60 T300 60"
          stroke="#e2e8f0"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Quest nodes */}
        {quests.slice(0, 4).map((quest, index) => {
          const x = 30 + (index * 90);
          const y = index % 2 === 0 ? 60 : 45;
          
          return (
            <Circle
              key={quest.id}
              cx={x}
              cy={y}
              r="12"
              fill={getCircleColor(quest.progress)}
              stroke="#ffffff"
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