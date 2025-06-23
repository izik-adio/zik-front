import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Lightbulb } from 'lucide-react-native';
import { LogoImage } from '@/components/core/LogoImage';

interface FirstQuestScreenProps {
  onNext: (data: { firstQuest: string }) => void;
  userData: { name: string; firstQuest: string };
}

export function FirstQuestScreen({ onNext, userData }: FirstQuestScreenProps) {
  const [quest, setQuest] = useState(userData.firstQuest || '');
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = [
    'Read for 30 minutes daily',
    'Exercise 3 times a week',
    'Meditate every morning',
    'Learn something new',
    'Practice gratitude',
    'Drink more water',
  ];

  const handleNext = () => {
    if (quest.trim()) {
      onNext({ firstQuest: quest.trim() });
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuest(suggestion);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <View style={styles.logoContainer}>
          <LogoImage size={48} />
        </View>
        <Text style={styles.title}>Your First Epic Quest</Text>
        <Text style={styles.subtitle}>
          What&apos;s one meaningful goal you&apos;d like to work towards?
        </Text>
      </Animated.View>

      <Animated.View
        style={styles.content}
        entering={FadeInUp.delay(400).springify()}
      >
        <TextInput
          style={[
            styles.input,
            isFocused && { borderColor: '#f97316' }, // Orange focus border
          ]}
          placeholder="I want to..."
          value={quest}
          onChangeText={setQuest}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          returnKeyType="done"
          onSubmitEditing={handleNext}
        />

        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsHeader}>
            <Lightbulb size={16} color="#f97316" />
            <Text style={styles.suggestionsTitle}>Need inspiration?</Text>
          </View>
          <View style={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={styles.buttonContainer}
        entering={FadeInUp.delay(600).springify()}
      >
        <TouchableOpacity
          style={[styles.button, !quest.trim() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!quest.trim()}
        >
          <Text
            style={[
              styles.buttonText,
              !quest.trim() && styles.buttonTextDisabled,
            ]}
          >
            Create My Quest
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  content: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 24,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  suggestionsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1e293b',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#475569',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#94a3b8',
  },
});
