import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Plus, Map, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  useEpicQuests,
  useIsRefreshing,
  useFetchEpicQuests,
  useRefreshQuestsData,
  useCreateEpicQuest,
  useDeleteEpicQuest,
  useGenerateRoadmap,
  useRefreshAllPages
} from '../../src/store/questStore';
import { EpicQuest, CreateEpicQuestData, CreateDailyQuestData } from '../../src/api/quests';
import { EpicQuestCard } from '../../components/quests/EpicQuestCard';
import { AddTaskModal } from '../../components/today/AddTaskModal';
import { showAlert } from '../../utils/showAlert';

export default function EpicQuestsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const insets = useSafeAreaInsets();

  const epicQuests = useEpicQuests();
  const isRefreshing = useIsRefreshing();

  // Debug logging for Goals screen
  console.log('GoalsScreen: Epic quests data:', {
    epicQuests: epicQuests,
    epicQuestsLength: epicQuests?.length || 0,
    isRefreshing: isRefreshing
  });

  // Get individual actions from store to prevent re-renders
  const fetchEpicQuests = useFetchEpicQuests();
  const refreshQuestsData = useRefreshQuestsData();
  const createEpicQuest = useCreateEpicQuest();
  const deleteEpicQuest = useDeleteEpicQuest();
  const generateRoadmap = useGenerateRoadmap();
  const refreshAllPages = useRefreshAllPages();

  useEffect(() => {
    if (user) {
      fetchEpicQuests();
    }
  }, [user, fetchEpicQuests]);

  const handleRefresh = async () => {
    if (user) {
      await refreshQuestsData();
    }
  };

  const handleCreateEpicQuest = async (questData: CreateEpicQuestData | CreateDailyQuestData) => {
    try {
      // Only process epic quests in this screen
      if (questData.type !== 'epic') {
        showAlert('Error', 'Only epic quests can be created from this screen');
        return;
      }

      const epic = await createEpicQuest(questData);
      setShowCreateModal(false);

      // Refresh all pages to ensure both today and goals pages are updated
      await refreshAllPages();

      // Check if this is a complex goal that needs a roadmap
      const isComplexGoal = questData.description && questData.description.length > 50;
      if (isComplexGoal) {
        showAlert(
          'Generating Your Journey',
          'AI is creating a personalized roadmap for your Epic Quest. This may take a few moments.',
          [{ text: 'OK' }]
        );

        // Start roadmap generation
        await generateRoadmap(epic.questId);
      }
    } catch (error) {
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create Epic Quest'
      );
    }
  };

  const handleEpicQuestPress = (epicId: string) => {
    router.push(`/epic/${epicId}` as any);
  };

  return (
    <View style={[
      { flex: 1, backgroundColor: theme.colors.background },
      { paddingTop: insets.top }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Map size={28} color={theme.colors.ctaPrimary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Epic Quests
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
            Your journey to greatness
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: theme.colors.ctaPrimary }]}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.ctaPrimary}
            colors={[theme.colors.ctaPrimary]}
          />
        }
      >
        {epicQuests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles size={64} color={theme.colors.ctaPrimary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Ready for an Epic Journey?
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.subtitle }]}>
              Create your first Epic Quest and let us build a personalized roadmap to help you achieve your biggest dreams!
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={[styles.createFirstButton, { backgroundColor: theme.colors.ctaPrimary }]}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.createFirstButtonText}>Create My First Epic Quest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Helper text for interacting with goals */}
            <View style={styles.helpContainer}>
              <Text style={[styles.helpText, { color: theme.colors.subtitle }]}>
                💡 Tap any Epic Quest card to view your personalized roadmap and track progress
              </Text>
            </View>

            {epicQuests.map((goal: EpicQuest) => (
              <EpicQuestCard
                key={goal.questId}
                epic={goal}
                onPress={() => handleEpicQuestPress(goal.questId)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create Quest Modal */}
      <AddTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdd={handleCreateEpicQuest}
        defaultEpicMode={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
