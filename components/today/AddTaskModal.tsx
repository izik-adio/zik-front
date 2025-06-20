import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, SafeAreaView, Switch } from 'react-native';
import { X } from 'lucide-react-native';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, time: string, isEpic: boolean) => void;
}

export function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [isEpic, setIsEpic] = useState(false);

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim(), time.trim() || '10 min', isEpic);
      setTitle('');
      setTime('');
      setIsEpic(false);
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setTime('');
    setIsEpic(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Quest</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Quest Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to accomplish?"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Estimated Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30 min, 2 hours, All day"
              value={time}
              onChangeText={setTime}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Epic Quest</Text>
              <Text style={styles.switchDescription}>
                Mark as a long-term goal with milestones
              </Text>
            </View>
            <Switch
              value={isEpic}
              onValueChange={setIsEpic}
              trackColor={{ false: '#e2e8f0', true: '#a7f3d0' }}
              thumbColor={isEpic ? '#14b8a6' : '#f4f4f5'}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!title.trim()}
          >
            <Text style={[styles.addButtonText, !title.trim() && styles.addButtonTextDisabled]}>
              Add Quest
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  switchDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
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
  addButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#14b8a6',
  },
  addButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  addButtonTextDisabled: {
    color: '#94a3b8',
  },
});