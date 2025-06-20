import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Trophy, Target, Calendar } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import { questsApi, Quest } from '@/src/api/quests';
import { storage } from '@/src/utils/storage';
import { QuestPath } from '@/components/quests/QuestPath';
import { QuestCard } from '@/components/quests/QuestCard';
import { CreateQuestModal } from '@/components/quests/CreateQuestModal';

export default function QuestsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localQuests, setLocalQuests] = useState([]);

  // Fetch quests from API
  const { data: apiQuests = [], isLoading } = useQuery({
    queryKey: ['quests'],
    queryFn: questsApi.getQuests,
    enabled: !!user,
  });

  // Create quest mutation
  const createQuestMutation = useMutation({
    mutationFn: questsApi.createQuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });

  // Update quest mutation
  const updateQuestMutation = useMutation({
    mutationFn: ({ questId, data }: { questId: string; data: any }) => 
      questsApi.updateQuest(questId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
  useEffect(() => {
    loadLocalQuests();
  }, []);

  const loadLocalQuests = async () => {
    try {
      const saved = await storage.getItem('epicQuests');
      if (saved) {
        setLocalQuests(saved);
      } else {
        // Default epic quests
        const defaultQuests = [
          {
            id: '1',
            title: 'Master Mindfulness',
            description: 'Develop a consistent meditation practice',
            milestones: [
              { id: '1', title: 'Meditate for 7 days straight', completed: true },
              { id: '2', title: 'Try 3 different meditation styles', completed: false },
              { id: '3', title: 'Meditate for 30 minutes', completed: false },
            ],
            category: 'wellness',
            progress: 33,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Fitness Journey',
            description: 'Build strength and endurance',
            milestones: [
              { id: '1', title: 'Work out 3 times this week', completed: false },
              { id: '2', title: 'Try a new sport or activity', completed: false },
              { id: '3', title: 'Run 5K without stopping', completed: false },
            ],
            category: 'fitness',
            progress: 0,
            createdAt: new Date().toISOString(),
          },
        ];
        setLocalQuests(defaultQuests);
        await storage.setItem('epicQuests', defaultQuests);
      }
    } catch (error) {
      console.error('Error loading epic quests:', error);
    }
  };

  const createQuest = async (questData: any) => {
    if (user) {
      // Create via API
      try {
        await createQuestMutation.mutateAsync({
          title: questData.title,
          description: questData.description,
        });
      } catch (error) {
        console.error('Error creating quest:', error);
      }
    } else {
      // Create locally
      const newQuest = {
        id: Date.now().toString(),
        ...questData,
        progress: 0,
        createdAt: new Date().toISOString(),
      };
      
      const updatedQuests = [...localQuests, newQuest];
      setLocalQuests(updatedQuests);
      
      try {
        await storage.setItem('epicQuests', updatedQuests);
      } catch (error) {
        console.error('Error saving new quest:', error);
      }
    }
  };

  const updateQuestProgress = async (questId: string, milestoneId: string) => {
    // Handle local quests
    const updatedQuests = localQuests.map(quest => {
      if (quest.id === questId) {
        const updatedMilestones = quest.milestones.map(milestone => {
          if (milestone.id === milestoneId) {
            return { ...milestone, completed: !milestone.completed };
          }
          return milestone;
        });
        
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = (completedCount / updatedMilestones.length) * 100;
        
        return {
          ...quest,
          milestones: updatedMilestones,
          progress: Math.round(progress),
        };
      }
      return quest;
    });
    
    setLocalQuests(updatedQuests);
    
    try {
      await storage.setItem('epicQuests', updatedQuests);
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  };

  // Convert API quests to local format for display
  const convertedApiQuests = apiQuests.map(quest => ({
    id: quest.questId,
    title: quest.title,
    description: quest.description,
    category: 'general',
    progress: quest.status === 'completed' ? 100 : 0,
    milestones: [
      { id: '1', title: quest.description, completed: quest.status === 'completed' }
    ],
    createdAt: quest.createdAt,
  }));

  const allQuests = [...localQuests, ...convertedApiQuests];
  const completedQuests = allQuests.filter(q => q.progress === 100);
  const activeQuests = allQuests.filter(q => q.progress < 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Epic Quests</Text>
        <Text style={styles.headerSubtitle}>Your journey to greatness</Text>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>New Quest</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pathContainer}>
          <QuestPath quests={activeQuests} />
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Target size={24} color="#14b8a6" />
            <Text style={styles.statNumber}>{activeQuests.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={24} color="#f97316" />
            <Text style={styles.statNumber}>{completedQuests.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={24} color="#8b5cf6" />
            <Text style={styles.statNumber}>{allQuests.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Quests</Text>
          {activeQuests.map((quest, index) => (
            <Animated.View
              key={quest.id}
              entering={FadeInUp.delay(index * 100)}
            >
              <QuestCard
                quest={quest}
                onMilestoneToggle={(milestoneId) => 
                  updateQuestProgress(quest.id, milestoneId)
                }
              />
            </Animated.View>
          ))}
        </View>

        {completedQuests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Quests</Text>
            {completedQuests.map((quest, index) => (
              <Animated.View
                key={quest.id}
                entering={FadeInUp.delay(index * 100)}
              >
                <QuestCard
                  quest={quest}
                  completed={true}
                  onMilestoneToggle={() => {}}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateQuestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createQuest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1e293b',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14b8a6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  pathContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1e293b',
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 8,
  },
});