import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface SuggestionChipProps {
  text: string;
  onPress: () => void;
}

export function SuggestionChip({ text, onPress }: SuggestionChipProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
