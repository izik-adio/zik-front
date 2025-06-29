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
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { X, Sparkles, Edit3, Calendar, Clock, Flag, Tag, Target, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    setShowModeSelector(false);
    setShowAdvanced(false);
    setAiPrompt('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setTargetDate('');
    setPriority('medium');
    setCategory('');
    setShowCategoryPicker(false);
    onClose();
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Error', 'Please describe what you want to create');
      return;
    }

    // Simple, direct prompts
    const contextPrompt = isEpic
      ? `Help me create a goal: "${aiPrompt.trim()}"`
      : `Help me create a task: "${aiPrompt.trim()}"`;

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

  const renderCompactHeader = () => (
    <View style={[styles.compactHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
      {/* Top row with title and close */}
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Create Quest
          </Text>
          <TouchableOpacity
            style={[styles.modeToggle, { backgroundColor: theme.colors.background }]}
            onPress={() => setShowModeSelector(!showModeSelector)}
          >
            <Text style={[styles.modeToggleText, { color: theme.colors.primary }]}>
              {creationMode === 'manual' ? 'Manual' : 'AI'}
            </Text>
            {showModeSelector ?
              <ChevronUp size={16} color={theme.colors.primary} /> :
              <ChevronDown size={16} color={theme.colors.primary} />
            }
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={theme.colors.subtitle} />
        </TouchableOpacity>
      </View>

      {/* Epic toggle row */}
      <View style={styles.headerBottom}>
        <View style={styles.epicToggleCompact}>
          <Text style={[styles.epicLabel, { color: theme.colors.text }]}>
            Epic Quest
            {defaultEpicMode && <Text style={[styles.lockIndicator, { color: theme.colors.primary }]}> 🔒</Text>}
          </Text>
          <Switch
            value={isEpic}
            onValueChange={defaultEpicMode ? undefined : setIsEpic}
            disabled={defaultEpicMode}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary + '50',
            }}
            thumbColor={isEpic ? theme.colors.primary : theme.colors.card}
            style={styles.compactSwitch}
          />
        </View>
        <Text style={[styles.epicDescription, { color: theme.colors.subtitle }]}>
          {isEpic ? 'Long-term goal' : 'Daily task'}
        </Text>
      </View>

      {/* Expandable mode selector */}
      {showModeSelector && (
        <View style={[styles.expandedModeSelector, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[
              styles.modeOptionCompact,
              creationMode === 'manual' && [styles.modeOptionActive, { backgroundColor: theme.colors.primary }],
              { borderColor: theme.colors.border }
            ]}
            onPress={() => {
              setCreationMode('manual');
              setShowModeSelector(false);
            }}
          >
            <Edit3 size={16} color={creationMode === 'manual' ? '#ffffff' : theme.colors.subtitle} />
            <Text style={[
              styles.modeOptionText,
              { color: creationMode === 'manual' ? '#ffffff' : theme.colors.subtitle }
            ]}>
              Manual Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeOptionCompact,
              creationMode === 'ai' && [styles.modeOptionActive, { backgroundColor: theme.colors.primary }],
              { borderColor: theme.colors.border }
            ]}
            onPress={() => {
              setCreationMode('ai');
              setShowModeSelector(false);
            }}
          >
            <Sparkles size={16} color={creationMode === 'ai' ? '#ffffff' : theme.colors.subtitle} />
            <Text style={[
              styles.modeOptionText,
              { color: creationMode === 'ai' ? '#ffffff' : theme.colors.subtitle }
            ]}>
              AI Generate
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAiMode = () => (
    <View style={styles.content}>
      <View style={[styles.aiCardCompact, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.aiHeaderCompact}>
          <Sparkles size={20} color={theme.colors.primary} />
          <Text style={[styles.aiTitleCompact, { color: theme.colors.text }]}>
            Describe your {isEpic ? 'goal' : 'task'}
          </Text>
        </View>

        <TextInput
          style={[
            styles.aiInputCompact,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: focusedField === 'aiPrompt' ? theme.colors.primary : theme.colors.inputBorder,
              color: theme.colors.text,
            },
          ]}
          placeholder={isEpic
            ? 'What goal do you want to achieve?'
            : 'What task do you need to complete?'
          }
          placeholderTextColor={theme.colors.subtitle}
          value={aiPrompt}
          onChangeText={setAiPrompt}
          onFocus={() => setFocusedField('aiPrompt')}
          onBlur={() => setFocusedField(null)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoFocus
        />

        <TouchableOpacity
          style={[
            styles.aiGenerateButtonCompact,
            { backgroundColor: theme.colors.primary },
            !aiPrompt.trim() && { backgroundColor: theme.colors.border }
          ]}
          onPress={handleAiGenerate}
          disabled={!aiPrompt.trim()}
        >
          <Sparkles size={18} color="#ffffff" />
          <Text style={styles.aiGenerateButtonTextCompact}>
            Generate with AI
          </Text>
        </TouchableOpacity>

        <Text style={[styles.aiNoteCompact, { color: theme.colors.subtitle }]}>
          💡 Opens Zik chat with: "Help me create a {isEpic ? 'goal' : 'task'}: [your input]"
        </Text>
      </View>

      {/* Quick examples */}
      <View style={[styles.examplesCardCompact, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.examplesTitleCompact, { color: theme.colors.text }]}>
          Quick examples:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesScrollCompact}>
          {(isEpic
            ? ['Learn Spanish', 'Get fit', 'Build an app', 'Start a business']
            : ['Organize office', 'Plan meals', 'Review proposal', 'Exercise 30min']
          ).map((example, index) => (
            <TouchableOpacity
              key={`example-${example}-${index}`}
              style={[styles.exampleChipCompact, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => setAiPrompt(example)}
            >
              <Text style={[styles.exampleChipTextCompact, { color: theme.colors.subtitle }]}>
                {example}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderManualMode = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Primary Fields */}
      <View style={[styles.fieldCardCompact, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.fieldCompact}>
          <Text style={[styles.labelCompact, { color: theme.colors.text }]}>
            <Target size={14} color={theme.colors.primary} /> Title *
          </Text>
          <TextInput
            style={[
              styles.inputCompact,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: focusedField === 'title' ? theme.colors.primary : theme.colors.inputBorder,
                color: theme.colors.text,
              },
            ]}
            placeholder={isEpic
              ? 'e.g., Learn to play guitar, Get in shape'
              : 'What do you want to accomplish?'
            }
            placeholderTextColor={theme.colors.subtitle}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            autoFocus
          />
        </View>

        <View style={styles.fieldCompact}>
          <Text style={[styles.labelCompact, { color: theme.colors.text }]}>
            <Edit3 size={14} color={theme.colors.primary} /> Description *
          </Text>
          <TextInput
            style={[
              styles.inputCompact,
              styles.textAreaCompact,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: focusedField === 'description' ? theme.colors.primary : theme.colors.inputBorder,
                color: theme.colors.text,
              },
            ]}
            placeholder={isEpic
              ? 'Describe your long-term goal and what success looks like'
              : 'Describe what you need to do'
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

        {/* Inline Priority and Date */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldCompact, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.labelCompact, { color: theme.colors.text }]}>
              <Flag size={14} color={theme.colors.primary} /> Priority
            </Text>
            <View style={styles.priorityContainerCompact}>
              {PRIORITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityButtonCompact,
                    { borderColor: theme.colors.border },
                    priority === option.value && {
                      backgroundColor: option.color + '20',
                      borderColor: option.color
                    }
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <View style={[styles.priorityDotCompact, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.priorityTextCompact,
                    { color: priority === option.value ? theme.colors.text : theme.colors.subtitle }
                  ]}>
                    {option.label.charAt(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.fieldCompact, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.labelCompact, { color: theme.colors.text }]}>
              <Calendar size={14} color={theme.colors.primary} /> {isEpic ? 'Target' : 'Due'} *
            </Text>
            <TextInput
              style={[
                styles.inputCompact,
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
      </View>

      {/* Optional Fields */}
      <TouchableOpacity
        style={[styles.advancedToggle, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={[styles.advancedToggleText, { color: theme.colors.text }]}>
          <Tag size={14} color={theme.colors.primary} /> Category {isEpic && '*'} {!isEpic && '(optional)'}
        </Text>
        {showAdvanced ?
          <ChevronUp size={16} color={theme.colors.subtitle} /> :
          <ChevronDown size={16} color={theme.colors.subtitle} />
        }
      </TouchableOpacity>

      {showAdvanced && (
        <View style={[styles.fieldCardCompact, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.fieldCompact}>
            <TouchableOpacity
              style={[
                styles.inputCompact,
                styles.categorySelectorCompact,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: showCategoryPicker ? theme.colors.primary : theme.colors.inputBorder,
                },
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[
                styles.categoryTextCompact,
                { color: category ? theme.colors.text : theme.colors.subtitle }
              ]}>
                {category || 'Select a category'}
              </Text>
              <ChevronDown size={16} color={theme.colors.subtitle} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={[styles.categoryPickerCompact, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <ScrollView style={styles.categoryScrollCompact} nestedScrollEnabled={true}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.categoryOptionCompact}
                      onPress={() => {
                        setCategory(option);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[styles.categoryOptionTextCompact, { color: theme.colors.text }]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Add some bottom padding for keyboard */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.container}>
          {/* Compact Header */}
          {renderCompactHeader()}

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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Compact Header
  compactHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  modeToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  epicToggleCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  epicLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  lockIndicator: {
    fontSize: 10,
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  epicDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Expandable Mode Selector
  expandedModeSelector: {
    marginTop: 8,
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  modeOptionCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  modeOptionActive: {
    borderWidth: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // AI Mode - Compact
  aiCardCompact: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  aiHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiTitleCompact: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  aiInputCompact: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    minHeight: 100,
    marginBottom: 16,
  },
  aiGenerateButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiGenerateButtonTextCompact: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
  aiNoteCompact: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // AI Examples
  examplesCardCompact: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  examplesTitleCompact: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginBottom: 8,
  },
  examplesScrollCompact: {
    flexDirection: 'row',
  },
  exampleChipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  exampleChipTextCompact: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },

  // Manual Mode - Compact
  fieldCardCompact: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fieldCompact: {
    marginBottom: 12,
  },
  labelCompact: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputCompact: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  textAreaCompact: {
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // Row fields for inline elements
  rowFields: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Priority - Compact
  priorityContainerCompact: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityButtonCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  priorityDotCompact: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityTextCompact: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },

  // Advanced Toggle
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  advancedToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Category - Compact
  categorySelectorCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTextCompact: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  categoryPickerCompact: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryScrollCompact: {
    maxHeight: 120,
  },
  categoryOptionCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryOptionTextCompact: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: 16,
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },
});
