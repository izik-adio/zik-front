import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle, Trophy } from 'lucide-react-native';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    milestones: Array<{
      id: string;
      title: string;
      completed: boolean;
    }>;
    progress: number;
    category: string;
  };
  completed?: boolean;
  onMilestoneToggle: (milestoneId: string) => void;
}

export function QuestCard({ quest, completed = false, onMilestoneToggle }: QuestCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wellness': return '#14b8a6';
      case 'fitness': return '#f97316';
      case 'learning': return '#8b5cf6';
      case 'creativity': return '#ec4899';
      default: return '#64748b';
    }
  };

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, completed && styles.completedTitle]}>
            {quest.title}
          </Text>
          {completed && (
            <Trophy size={20} color="#f97316" style={styles.trophy} />
          )}
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(quest.category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(quest.category) }]}>
            {quest.category}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, completed && styles.completedDescription]}>
        {quest.description}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${quest.progress}%`,
                backgroundColor: getCategoryColor(quest.category)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{quest.progress}%</Text>
      </View>

      <View style={styles.milestones}>
        {quest.milestones.map((milestone) => (
          <TouchableOpacity
            key={milestone.id}
            style={styles.milestone}
            onPress={() => !completed && onMilestoneToggle(milestone.id)}
            disabled={completed}
          >
            {milestone.completed ? (
              <CheckCircle size={20} color="#14b8a6" />
            ) : (
              <Circle size={20} color="#e2e8f0" />
            )}
            <Text style={[
              styles.milestoneText,
              milestone.completed && styles.completedMilestoneText
            ]}>
              {milestone.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1e293b',
  },
  completedTitle: {
    color: '#94a3b8',
  },
  trophy: {
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  completedDescription: {
    color: '#94a3b8',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1e293b',
    minWidth: 40,
    textAlign: 'right',
  },
  milestones: {
    gap: 12,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  completedMilestoneText: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
});