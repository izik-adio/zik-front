import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, time: string, isEpic: boolean) => void;
}

export function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const { theme } = useTheme();
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Add New Quest
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.colors.subtitle} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Quest Title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.text,
                },
              ]}
              placeholder="What do you want to accomplish?"
              placeholderTextColor={theme.colors.subtitle}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Estimated Time
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.text,
                },
              ]}
              placeholder="e.g., 30 min, 2 hours, All day"
              placeholderTextColor={theme.colors.subtitle}
              value={time}
              onChangeText={setTime}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Epic Quest
              </Text>
              <Text
                style={[
                  styles.switchDescription,
                  { color: theme.colors.subtitle },
                ]}
              >
                Mark as a long-term goal with milestones
              </Text>
            </View>
            <Switch
              value={isEpic}
              onValueChange={setIsEpic}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + '50',
              }}
              thumbColor={isEpic ? theme.colors.primary : theme.colors.card}
            />
          </View>
        </View>

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
            style={[styles.cancelButton, { borderColor: theme.colors.border }]}
            onPress={handleClose}
          >
            <Text
              style={[styles.cancelButtonText, { color: theme.colors.text }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.ctaPrimary },
              !title.trim() && [
                styles.addButtonDisabled,
                { backgroundColor: theme.colors.border },
              ],
            ]}
            onPress={handleAdd}
            disabled={!title.trim()}
          >
            <Text
              style={[
                styles.addButtonText,
                !title.trim() && styles.addButtonTextDisabled,
              ]}
            >
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  switchDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
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
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  addButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {},
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  addButtonTextDisabled: {
    color: '#94a3b8',
  },
});
