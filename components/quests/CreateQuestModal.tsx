import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface CreateQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (questData: any) => void;
}

export function CreateQuestModal({
  visible,
  onClose,
  onCreate,
}: CreateQuestModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('wellness');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [milestones, setMilestones] = useState([
    { id: '1', title: '', completed: false },
    { id: '2', title: '', completed: false },
    { id: '3', title: '', completed: false },
  ]);

  const categories = [
    { id: 'wellness', name: 'Wellness', color: theme.colors.ctaPrimary },
    { id: 'fitness', name: 'Fitness', color: '#f97316' },
    { id: 'learning', name: 'Learning', color: '#8b5cf6' },
    { id: 'creativity', name: 'Creativity', color: '#ec4899' },
  ];

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) return;

    const validMilestones = milestones.filter((m) => m.title.trim());
    if (validMilestones.length === 0) return;

    const questData = {
      title: title.trim(),
      description: description.trim(),
      category,
      milestones: validMilestones.map((m) => ({
        ...m,
        title: m.title.trim(),
      })),
    };

    onCreate(questData);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('wellness');
    setMilestones([
      { id: '1', title: '', completed: false },
      { id: '2', title: '', completed: false },
      { id: '3', title: '', completed: false },
    ]);
    onClose();
  };

  const updateMilestone = (id: string, title: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title } : m))
    );
  };

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString();
    setMilestones((prev) => [
      ...prev,
      { id: newId, title: '', completed: false },
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#64748b';
  };

  const isFormValid =
    title.trim() &&
    description.trim() &&
    milestones.some((m) => m.title.trim());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Create Epic Quest
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Quest Title
            </Text>{' '}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor:
                    focusedField === 'title'
                      ? theme.colors.ctaPrimary
                      : theme.colors.inputBorder,
                  color: theme.colors.text,
                },
              ]}
              placeholder="What's your epic quest?"
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
              Description
            </Text>{' '}
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor:
                    focusedField === 'description'
                      ? theme.colors.ctaPrimary
                      : theme.colors.inputBorder,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Describe your journey..."
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
              Category
            </Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: cat.color + '20' },
                    category === cat.id && {
                      borderColor: cat.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.categoryText, { color: cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.milestonesHeader}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Milestones
              </Text>{' '}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.ctaPrimary + '20' },
                ]}
                onPress={addMilestone}
              >
                <Plus size={16} color={theme.colors.ctaPrimary} />
              </TouchableOpacity>
            </View>
            {milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneItem}>
                {' '}
                <TextInput
                  style={[
                    styles.input,
                    styles.milestoneInput,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor:
                        focusedField === `milestone-${milestone.id}`
                          ? theme.colors.ctaPrimary
                          : theme.colors.inputBorder,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder={`Milestone ${index + 1}`}
                  placeholderTextColor={theme.colors.subtitle}
                  value={milestone.title}
                  onChangeText={(text) => updateMilestone(milestone.id, text)}
                  onFocus={() => setFocusedField(`milestone-${milestone.id}`)}
                  onBlur={() => setFocusedField(null)}
                />
                {milestones.length > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.removeButton,
                      { backgroundColor: theme.colors.error + '20' },
                    ]}
                    onPress={() => removeMilestone(milestone.id)}
                  >
                    <Minus size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: theme.colors.border },
            ]}
            onPress={handleClose}
          >
            <Text
              style={[
                styles.cancelButtonText,
                { color: theme.colors.subtitle },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: getCategoryColor(category) },
              !isFormValid && [
                styles.createButtonDisabled,
                { backgroundColor: theme.colors.border },
              ],
            ]}
            onPress={handleCreate}
            disabled={!isFormValid}
          >
            <Text
              style={[
                styles.createButtonText,
                !isFormValid && [
                  styles.createButtonTextDisabled,
                  { color: theme.colors.subtitle },
                ],
              ]}
            >
              Create Quest
            </Text>
          </TouchableOpacity>
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
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  milestoneInput: {
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  createButtonTextDisabled: {
    color: '#94a3b8',
  },
});
