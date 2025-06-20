import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';

interface CreateQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (questData: any) => void;
}

export function CreateQuestModal({ visible, onClose, onCreate }: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('wellness');
  const [milestones, setMilestones] = useState([
    { id: '1', title: '', completed: false },
    { id: '2', title: '', completed: false },
    { id: '3', title: '', completed: false },
  ]);

  const categories = [
    { id: 'wellness', name: 'Wellness', color: '#14b8a6' },
    { id: 'fitness', name: 'Fitness', color: '#f97316' },
    { id: 'learning', name: 'Learning', color: '#8b5cf6' },
    { id: 'creativity', name: 'Creativity', color: '#ec4899' },
  ];

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) return;
    
    const validMilestones = milestones.filter(m => m.title.trim());
    if (validMilestones.length === 0) return;

    const questData = {
      title: title.trim(),
      description: description.trim(),
      category,
      milestones: validMilestones.map(m => ({
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
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, title } : m)
    );
  };

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString();
    setMilestones(prev => [...prev, { id: newId, title: '', completed: false }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter(m => m.id !== id));
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#64748b';
  };

  const isFormValid = title.trim() && description.trim() && milestones.some(m => m.title.trim());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Epic Quest</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Quest Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What's your epic quest?"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your journey..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: cat.color + '20' },
                    category === cat.id && { borderColor: cat.color, borderWidth: 2 }
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
              <Text style={styles.label}>Milestones</Text>
              <TouchableOpacity style={styles.addButton} onPress={addMilestone}>
                <Plus size={16} color="#14b8a6" />
              </TouchableOpacity>
            </View>
            {milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <TextInput
                  style={[styles.input, styles.milestoneInput]}
                  placeholder={`Milestone ${index + 1}`}
                  value={milestone.title}
                  onChangeText={(text) => updateMilestone(milestone.id, text)}
                />
                {milestones.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMilestone(milestone.id)}
                  >
                    <Minus size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.createButton,
              { backgroundColor: getCategoryColor(category) },
              !isFormValid && styles.createButtonDisabled
            ]}
            onPress={handleCreate}
            disabled={!isFormValid}
          >
            <Text style={[styles.createButtonText, !isFormValid && styles.createButtonTextDisabled]}>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1e293b',
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
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1e293b',
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
    backgroundColor: '#f0fdfa',
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
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#64748b',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#e2e8f0',
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