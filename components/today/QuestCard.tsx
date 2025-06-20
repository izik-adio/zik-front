import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { CheckCircle, Circle, Brain, Droplets, Heart, Target, Clock } from 'lucide-react-native';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    time: string;
    icon: string;
    isEpic: boolean;
  };
  completed?: boolean;
  onToggle: () => void;
}

export function QuestCard({ quest, completed = false, onToggle }: QuestCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  const getIcon = () => {
    const iconProps = { size: 24, color: completed ? '#94a3b8' : '#14b8a6' };
    switch (quest.icon) {
      case 'brain': return <Brain {...iconProps} />;
      case 'droplets': return <Droplets {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      default: return <Target {...iconProps} />;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.card, completed && styles.completedCard]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, completed && styles.completedTitle]}>
              {quest.title}
            </Text>
            <View style={styles.details}>
              <View style={styles.timeContainer}>
                <Clock size={14} color="#64748b" />
                <Text style={styles.time}>{quest.time}</Text>
              </View>
              {quest.isEpic && (
                <View style={styles.epicBadge}>
                  <Text style={styles.epicText}>Epic Quest</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity style={styles.checkbox} onPress={handlePress}>
            {completed ? (
              <CheckCircle size={24} color="#14b8a6" />
            ) : (
              <Circle size={24} color="#e2e8f0" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  completedCard: {
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  epicBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  epicText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#f59e0b',
  },
  checkbox: {
    padding: 8,
  },
});