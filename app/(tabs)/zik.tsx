import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Mic } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { ChatBubble } from '@/components/zik/ChatBubble';
import { SuggestionChip } from '@/components/zik/SuggestionChip';

export default function ZikScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    'How was my day?',
    'Set a new goal',
    'I need motivation',
    'Plan tomorrow',
  ];

  useEffect(() => {
    // Initial greeting
    const initialMessage = {
      id: '1',
      text: "Hi! I'm Zik, your personal growth companion. How are you feeling today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMessage]);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate Zik's response
    setTimeout(() => {
      const zikResponse = generateZikResponse(text);
      const zikMessage = {
        id: (Date.now() + 1).toString(),
        text: zikResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, zikMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateZikResponse = (userText: string): string => {
    const responses = {
      'how was my day':
        "It sounds like you've had quite a journey today! What was the highlight that made you feel most accomplished?",
      'set a new goal':
        'I love your ambition! What area of your life would you like to focus on growing? Personal wellness, career, relationships, or something else?',
      'i need motivation':
        "You've got this! Remember, every small step forward is progress. What's one tiny action you could take right now to move closer to your dreams?",
      'plan tomorrow':
        "Great thinking ahead! Let's make tomorrow amazing. What are 3 things you want to accomplish that will make you feel proud?",
      default:
        "That's really interesting! Tell me more about what's on your mind. I'm here to support your growth journey.",
    };

    const lowerText = userText.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerText.includes(key)) {
        return response;
      }
    }
    return responses.default;
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
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
          Chat with Zik
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.subtitle }]}>
          Your AI growth companion
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 100)}
            >
              <ChatBubble message={message} />
            </Animated.View>
          ))}

          {isTyping && (
            <Animated.View entering={FadeInUp}>
              <ChatBubble
                message={{
                  id: 'typing',
                  text: 'Zik is thinking...',
                  isUser: false,
                  timestamp: new Date().toISOString(),
                }}
                isTyping={true}
              />
            </Animated.View>
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsContainer}
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                text={suggestion}
                onPress={() => handleSuggestionPress(suggestion)}
              />
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.subtitle}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
            >
              <Send
                size={20}
                color={inputText.trim() ? '#ffffff' : theme.colors.subtitle}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.micButton,
                { backgroundColor: theme.colors.inputBackground },
              ]}
            >
              <Mic size={20} color={theme.colors.subtitle} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
