import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SuggestionChipProps {
  text: string;
  onPress: () => void;
}

export function SuggestionChip({ text, onPress }: SuggestionChipProps) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#475569',
  },
});