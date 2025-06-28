import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { X, Sparkles, Edit3, Calendar, Clock, Flag, Tag, Target, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useChatStore } from '@/src/store/chatStore';
import { CreateDailyQuestData, CreateEpicQuestData } from '@/src/api/quests';
import { router } from 'expo-router';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (questData: CreateDailyQuestData | CreateEpicQuestData) => void;
  defaultEpicMode?: boolean; // For when opened from goals tab
}

type CreationMode = 'manual' | 'ai';
type Priority = 'low' | 'medium' | 'high';

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const CATEGORY_OPTIONS = [
  'Health & Fitness',
  'Work & Career',
  'Personal Growth',
  'Relationships',
  'Finance',
  'Education',
  'Creativity',
  'Home & Lifestyle',
  'Travel',
  'Other',
];

export function AddTaskModal({
  visible,
  onClose,
  onAdd,
  defaultEpicMode = false
}: AddTaskModalProps) {
  const { theme } = useTheme();
  const { setPrefilledInput } = useChatStore();

  // Form state
  const [creationMode, setCreationMode] = useState<CreationMode>('manual');
  const [isEpic, setIsEpic] = useState(defaultEpicMode);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // AI mode state
  const [aiPrompt, setAiPrompt] = useState('');

  // Manual mode state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize default dates and epic mode
  useEffect(() => {
    if (visible) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setDueDate(todayStr);

      // Default target date for epic quests (3 months from now)
      const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      setTargetDate(threeMonthsLater.toISOString().split('T')[0]);

      // Set epic mode based on defaultEpicMode prop
      setIsEpic(defaultEpicMode);
    }
  }, [visible, defaultEpicMode]);

  const handleClose = () => {
    // Reset all form state
    setCreationMode('manual');
    setIsEpic(defaultEpicMode);
    setFocusedField(null);
    setAiPrompt('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setTargetDate('');
    setPriority('medium');
    setCategory('');
    setShowCategoryPicker(false);
    setShowAdvanced(false);
    onClose();
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Error', 'Please describe what you want to create');
      return;
    }

    // Generate contextual prompt based on quest type
    const contextPrompt = isEpic
      ? `Help me create a comprehensive roadmap for this long-term goal: "${aiPrompt.trim()}". Please break it down into milestones, actionable steps, and suggest a realistic timeline. I want to understand what daily tasks and weekly goals I should focus on to achieve this epic quest.`
      : `Help me break down this daily task: "${aiPrompt.trim()}". Please suggest specific steps, time estimates, and any tips to complete it efficiently. If it's too big for one day, help me split it into manageable parts.`;

    // Set the prompt in chat store and navigate to chat
    setPrefilledInput(contextPrompt);
    handleClose();
    router.push('/(tabs)/zik');
  };

  const handleManualCreate = () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (isEpic && !category.trim()) {
      Alert.alert('Error', 'Please select a category for epic quests');
      return;
    }

    // Create quest data based on type
    const questData = isEpic ? {
      title: title.trim(),
      description: description.trim(),
      targetDate: targetDate,
      category: category,
      priority,
      type: 'epic' as const,
    } : {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate,
      priority,
      category: category || undefined,
      type: 'daily' as const,
    };

    onAdd(questData);
    handleClose();
  };

  const renderModeSelector = () => (
    <View style={[styles.modeSelector, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          creationMode === 'manual' && [styles.modeButtonActive, { backgroundColor: theme.colors.primary }],
          { borderColor: theme.colors.border }
        ]}
        onPress={() => setCreationMode('manual')}
      >
        <Edit3 size={18} color={creationMode === 'manual' ? '#ffffff' : theme.colors.subtitle} />
        <Text style={[
          styles.modeButtonText,
          { color: creationMode === 'manual' ? '#ffffff' : theme.colors.subtitle }
        ]}>
          Manual
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          creationMode === 'ai' && [styles.modeButtonActive, { backgroundColor: theme.colors.primary }],
          { borderColor: theme.colors.border }
        ]}
        onPress={() => setCreationMode('ai')}
      >
        <Sparkles size={18} color={creationMode === 'ai' ? '#ffffff' : theme.colors.subtitle} />
        <Text style={[
          styles.modeButtonText,
          { color: creationMode === 'ai' ? '#ffffff' : theme.colors.subtitle }
        ]}>
          AI Generate
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEpicToggle = () => (
    <View style={[styles.toggleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.toggleContent}>
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>
            Epic Quest {defaultEpicMode && <Text style={[styles.lockIndicator, { color: theme.colors.primary }]}>🔒</Text>}
          </Text>
          <Text style={[styles.toggleDescription, { color: theme.colors.subtitle }]}>
            {isEpic
              ? 'Create a long-term goal with milestones and roadmap'
              : 'Create a single-day task to complete today'
            }
            {defaultEpicMode && '\n(Fixed to Epic mode in Goals tab)'}
          </Text>
        </View>
        <Switch
          value={isEpic}
          onValueChange={defaultEpicMode ? undefined : setIsEpic}
          disabled={defaultEpicMode}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary + '50',
          }}
          thumbColor={isEpic ? theme.colors.primary : theme.colors.card}
        />
      </View>
    </View>
  );

  const renderAiMode = () => (
    <View style={styles.content}>
      <View style={[styles.aiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.aiHeader}>
          <Sparkles size={24} color={theme.colors.primary} />
          <Text style={[styles.aiTitle, { color: theme.colors.text }]}>
            AI-Powered Creation
          </Text>
        </View>
        <Text style={[styles.aiDescription, { color: theme.colors.subtitle }]}>
          Describe what you want to {isEpic ? 'achieve' : 'do'}, and I'll help you create a structured plan
        </Text>

        {/* AI Mode Examples */}
        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesTitle, { color: theme.colors.text }]}>
            Examples:
          </Text>
          <Text style={[styles.exampleText, { color: theme.colors.subtitle }]}>
            {isEpic
              ? '• "Learn Spanish fluently"\n• "Run a half marathon"\n• "Build a mobile app"'
              : '• "Organize my home office"\n• "Plan next week\'s meals"\n• "Review project proposal"'
            }
          </Text>
        </View>

        <TextInput
          style={[
            styles.aiInput,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: focusedField === 'aiPrompt' ? theme.colors.primary : theme.colors.inputBorder,
              color: theme.colors.text,
            },
          ]}
          placeholder={isEpic
            ? 'e.g., "Learn to play guitar", "Get in shape", "Start a side business"'
            : 'e.g., "Organize my workspace", "Prepare for tomorrow\'s meeting", "Read 20 pages"'
          }
          placeholderTextColor={theme.colors.subtitle}
          value={aiPrompt}
          onChangeText={setAiPrompt}
          onFocus={() => setFocusedField('aiPrompt')}
          onBlur={() => setFocusedField(null)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoFocus
        />

        <TouchableOpacity
          style={[
            styles.aiGenerateButton,
            { backgroundColor: theme.colors.primary },
            !aiPrompt.trim() && { backgroundColor: theme.colors.border }
          ]}
          onPress={handleAiGenerate}
          disabled={!aiPrompt.trim()}
        >
          <Sparkles size={20} color="#ffffff" />
          <Text style={styles.aiGenerateButtonText}>
            Generate with AI
          </Text>
        </TouchableOpacity>

        <Text style={[styles.aiNote, { color: theme.colors.subtitle }]}>
          💡 This will take you to Zik chat with a structured prompt
        </Text>
      </View>
    </View>
  );

  const renderManualMode = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Basic Fields */}
      <View style={[styles.fieldCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Basic Information
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            <Target size={16} color={theme.colors.primary} /> Title *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: focusedField === 'title' ? theme.colors.primary : theme.colors.inputBorder,
                color: theme.colors.text,
              },
            ]}
            placeholder={isEpic
              ? 'e.g., Learn to play guitar, Get in shape, Start a business'
              : 'What do you want to accomplish today?'
            }
            placeholderTextColor={theme.colors.subtitle}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            <Edit3 size={16} color={theme.colors.primary} /> Description *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: focusedField === 'description' ? theme.colors.primary : theme.colors.inputBorder,
                color: theme.colors.text,
              },
            ]}
            placeholder={isEpic
              ? 'Describe your long-term goal and what success looks like'
              : 'Describe what you need to do and any specific requirements'
            }
            placeholderTextColor={theme.colors.subtitle}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            <Calendar size={16} color={theme.colors.primary} /> {isEpic ? 'Target Date *' : 'Due Date *'}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: focusedField === 'date' ? theme.colors.primary : theme.colors.inputBorder,
                color: theme.colors.text,
              },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.subtitle}
            value={isEpic ? targetDate : dueDate}
            onChangeText={isEpic ? setTargetDate : setDueDate}
            onFocus={() => setFocusedField('date')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>

      {/* Priority and Category */}
      <View style={[styles.fieldCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Settings
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            <Flag size={16} color={theme.colors.primary} /> Priority
          </Text>
          <View style={styles.priorityContainer}>
            {PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.priorityButton,
                  { borderColor: theme.colors.border },
                  priority === option.value && {
                    backgroundColor: option.color + '20',
                    borderColor: option.color
                  }
                ]}
                onPress={() => setPriority(option.value)}
              >
                <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                <Text style={[
                  styles.priorityText,
                  { color: priority === option.value ? theme.colors.text : theme.colors.subtitle }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            <Tag size={16} color={theme.colors.primary} /> Category {isEpic && '*'}
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.categorySelector,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: showCategoryPicker ? theme.colors.primary : theme.colors.inputBorder,
              },
            ]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[
              styles.categoryText,
              { color: category ? theme.colors.text : theme.colors.subtitle }
            ]}>
              {category || 'Select a category'}
            </Text>
            <ChevronDown size={20} color={theme.colors.subtitle} />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={[styles.categoryPicker, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              {CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(option);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, { color: theme.colors.text }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Create {isEpic ? 'Epic Quest' : 'Daily Quest'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        {renderModeSelector()}

        {/* Epic Quest Toggle */}
        {renderEpicToggle()}

        {/* Content based on mode */}
        {creationMode === 'ai' ? renderAiMode() : renderManualMode()}

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.colors.border }]}
            onPress={handleClose}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          {creationMode === 'manual' && (
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: theme.colors.primary },
                (!title.trim() || !description.trim() || (isEpic && !category.trim())) && {
                  backgroundColor: theme.colors.border
                }
              ]}
              onPress={handleManualCreate}
              disabled={!title.trim() || !description.trim() || (isEpic && !category.trim())}
            >
              <Text style={[
                styles.createButtonText,
                (!title.trim() || !description.trim() || (isEpic && !category.trim())) && {
                  color: theme.colors.subtitle
                }
              ]}>
                Create {isEpic ? 'Epic Quest' : 'Daily Quest'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },

  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  modeButtonActive: {
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },

  // Epic Toggle
  toggleCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toggleText: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  lockIndicator: {
    fontSize: 12,
  },
  toggleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // AI Mode
  aiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aiTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  aiDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 16,
  },
  examplesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  aiInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    minHeight: 80,
    marginBottom: 20,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiGenerateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  aiNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Manual Mode
  fieldCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Priority
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },

  // Category
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  categoryPicker: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  createButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
