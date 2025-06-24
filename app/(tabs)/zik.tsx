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
  Keyboard,
  Dimensions,
} from 'react-native';
import { Send, Mic, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { LogoImage } from '@/components/onboarding/LogoImage';
import { ChatBubble } from '@/components/zik/ChatBubble';
import { SuggestionChip } from '@/components/zik/SuggestionChip';

export default function ZikScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const sendButtonScale = useSharedValue(1);
  const inputFocused = useSharedValue(0);
  const onlineIndicatorScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);

  const suggestions = [
    'How was my day?',
    'Set a new goal',
    'I need motivation',
    'Plan tomorrow',
    'What should I focus on?',
    'Help me reflect',
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

    // Online indicator pulse animation
    const pulseAnimation = () => {
      onlineIndicatorScale.value = withSpring(1.3, { duration: 1000 }, () => {
        onlineIndicatorScale.value = withSpring(1, { duration: 1000 });
      });
    };
    pulseAnimation();
    const pulseInterval = setInterval(pulseAnimation, 2000);

    // Logo gentle rotation animation
    const logoAnimation = () => {
      logoRotation.value = withSpring(5, { duration: 2000 }, () => {
        logoRotation.value = withSpring(-5, { duration: 2000 }, () => {
          logoRotation.value = withSpring(0, { duration: 2000 });
        });
      });
    };
    logoAnimation();
    const logoInterval = setInterval(logoAnimation, 6000);

    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      clearInterval(pulseInterval);
      clearInterval(logoInterval);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Animate send button
    sendButtonScale.value = withSpring(0.8, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

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

      // Auto scroll after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
      'what should i focus on':
        "Let's prioritize what matters most to you right now. What area of your life feels like it needs the most attention or growth?",
      'help me reflect':
        "Reflection is so powerful! Take a moment to think: What's one thing you learned about yourself recently? I'm here to explore it with you.",
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
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    inputFocused.value = withSpring(1);
  };

  const handleInputBlur = () => {
    inputFocused.value = withSpring(0);
  };

  // Animated styles
  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sendButtonScale.value }],
      backgroundColor: inputText.trim()
        ? theme.colors.ctaPrimary
        : theme.colors.border,
    };
  });

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        inputFocused.value,
        [0, 1],
        [theme.colors.border, theme.colors.ctaPrimary]
      ),
      transform: [
        {
          scale: withSpring(inputFocused.value === 1 ? 1.02 : 1),
        },
      ],
    };
  });

  const onlineIndicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: onlineIndicatorScale.value }],
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${logoRotation.value}deg` }],
    };
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Enhanced Header */}
      <Animated.View
        entering={FadeInDown}
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
              <LogoImage size={44} />
            </Animated.View>
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.statusIndicator}>
              <Animated.View
                style={[
                  styles.onlineIndicator,
                  { backgroundColor: '#10B981' },
                  onlineIndicatorAnimatedStyle,
                ]}
              />
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: theme.colors.subtitle },
                ]}
              >
                Online • Ready to help
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
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

        {/* Enhanced Input Container */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              paddingBottom: Platform.OS === 'ios' ? 20 : 16,
            },
          ]}
        >
          {/* Suggestions */}
          {messages.length <= 1 && (
            <Animated.View entering={FadeInUp.delay(300)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionsContainer}
                contentContainerStyle={styles.suggestionsContent}
              >
                {suggestions.map((suggestion, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInUp.delay(400 + index * 50)}
                  >
                    <SuggestionChip
                      text={suggestion}
                      onPress={() => handleSuggestionPress(suggestion)}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Type your message..."
                placeholderTextColor={theme.colors.subtitle}
                value={inputText}
                onChangeText={setInputText}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                multiline
                maxLength={500}
                scrollEnabled={false}
              />
            </Animated.View>

            <Animated.View style={[styles.sendButton, sendButtonAnimatedStyle]}>
              <TouchableOpacity
                style={styles.sendButtonInner}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <Send
                  size={20}
                  color={inputText.trim() ? '#ffffff' : theme.colors.subtitle}
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.micButton,
                { backgroundColor: theme.colors.inputBackground },
              ]}
              activeOpacity={0.8}
            >
              <Mic size={20} color={theme.colors.subtitle} />
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    position: 'relative',
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  suggestionsContainer: {
    marginBottom: 16,
    maxHeight: 44,
  },
  suggestionsContent: {
    paddingRight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
