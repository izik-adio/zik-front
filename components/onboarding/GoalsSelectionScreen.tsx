import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import {
  Briefcase,
  Heart,
  Brain,
  Dumbbell,
  BookOpen,
  Users,
  Paintbrush,
  Music,
  Target,
  ArrowRight,
} from 'lucide-react-native';

interface GoalsSelectionScreenProps {
  onNext: (goals: string[]) => void;
  onSkip: () => void;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const goals: Goal[] = [
  {
    id: 'work-habits',
    title: 'Work Habits',
    description: 'Boost productivity & focus',
    icon: Briefcase,
    color: '#3b82f6',
  },
  {
    id: 'wellbeing',
    title: 'Wellbeing',
    description: 'Mental health & self-care',
    icon: Heart,
    color: '#ef4444',
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Learn & grow professionally',
    icon: Brain,
    color: '#8b5cf6',
  },
  {
    id: 'fitness',
    title: 'Fitness',
    description: 'Physical health & activity',
    icon: Dumbbell,
    color: '#10b981',
  },
  {
    id: 'learning',
    title: 'Learning',
    description: 'Knowledge & education',
    icon: BookOpen,
    color: '#f59e0b',
  },
  {
    id: 'social',
    title: 'Social',
    description: 'Relationships & connections',
    icon: Users,
    color: '#06b6d4',
  },
  {
    id: 'creativity',
    title: 'Creativity',
    description: 'Art, design & innovation',
    icon: Paintbrush,
    color: '#ec4899',
  },
  {
    id: 'hobbies',
    title: 'Hobbies',
    description: 'Personal interests & fun',
    icon: Music,
    color: '#f97316',
  },
];

export function GoalsSelectionScreen({
  onNext,
  onSkip,
}: GoalsSelectionScreenProps) {
  const { theme } = useTheme();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    onNext(selectedGoals);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          What would you like to focus on?
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
          Select the areas that matter most to you. You can always change these
          later! 🎯
        </Text>
      </Animated.View>

      {/* Goals Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={styles.goalsGrid}
          entering={FadeInDown.delay(400).springify()}
        >
          {goals.map((goal, index) => {
            const isSelected = selectedGoals.includes(goal.id);
            const IconComponent = goal.icon;

            return (
              <Animated.View
                key={goal.id}
                entering={SlideInRight.delay(500 + index * 100).springify()}
              >
                <TouchableOpacity
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected
                        ? goal.color
                        : theme.colors.card,
                      borderColor: isSelected
                        ? goal.color
                        : theme.colors.border,
                      shadowColor: isSelected ? goal.color : '#000000',
                    },
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.2)'
                            : `${goal.color}15`,
                        },
                      ]}
                    >
                      <IconComponent
                        size={24}
                        color={isSelected ? '#ffffff' : goal.color}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Text
                        style={[
                          styles.goalTitle,
                          { color: isSelected ? '#ffffff' : theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {goal.title}
                      </Text>
                      <Text
                        style={[
                          styles.goalDescription,
                          {
                            color: isSelected
                              ? 'rgba(255,255,255,0.9)'
                              : theme.colors.subtitle,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {goal.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View
        style={styles.bottomActions}
        entering={FadeInUp.delay(1200).springify()}
      >
        {selectedGoals.length > 0 && (
          <View style={styles.selectedCounter}>
            <Target size={16} color={theme.colors.ctaPrimary} />
            <Text
              style={[styles.counterText, { color: theme.colors.ctaPrimary }]}
            >
              {selectedGoals.length} selected
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: theme.colors.subtitle }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor:
                  selectedGoals.length > 0
                    ? theme.colors.ctaPrimary
                    : theme.colors.border,
                opacity: selectedGoals.length > 0 ? 1 : 0.6,
              },
            ]}
            onPress={handleContinue}
            disabled={selectedGoals.length === 0}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueText,
                {
                  color:
                    selectedGoals.length > 0
                      ? '#ffffff'
                      : theme.colors.subtitle,
                },
              ]}
            >
              {selectedGoals.length > 0 ? 'Continue' : 'Select at least one'}
            </Text>
            {selectedGoals.length > 0 && (
              <ArrowRight size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  goalCard: {
    width: '47%',
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexShrink: 0,
  },
  selectedCard: {
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  goalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  bottomActions: {
    marginTop: 20,
  },
  selectedCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  counterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
