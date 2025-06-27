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
  Alert,
} from 'react-native';
import { Send, Mic, CheckCircle, MoreVertical, Trash2 } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { useChatStore } from '@/src/store/chatStore';
import { LogoImage } from '@/components/onboarding/LogoImage';
import { ChatBubble } from '@/components/zik/ChatBubble';
import { SuggestionChip } from '@/components/zik/SuggestionChip';

export default function ZikScreen() {
  const { theme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [showQuestCreatedToast, setShowQuestCreatedToast] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    isRefreshingQuests,
    error,
    sendMessage,
    clearError,
    clearMessages,
  } = useChatStore();

  // Animation values
  const sendButtonScale = useSharedValue(1);
  const inputFocused = useSharedValue(0);
  const onlineIndicatorScale = useSharedValue(1);
  const logoRotation = useSharedValue(0);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(-50);

  const suggestions = [
    'How was my day?',
    'Set a new goal',
    'I need motivation',
    'Plan tomorrow',
    'What should I focus on?',
    'Help me reflect',
  ];

  useEffect(() => {
    // Add initial greeting if no messages exist
    if (messages.length === 0) {
      // This will be handled by the chat store initialization
    }

    // Handle errors
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [messages, error, clearError]); // Show toast when quest refresh completes
  useEffect(() => {
    let previousRefreshing = false;

    const unsubscribe = useChatStore.subscribe((state) => {
      if (previousRefreshing && !state.isRefreshingQuests) {
        // Quest refresh just completed, show success toast
        setShowQuestCreatedToast(true);
        toastOpacity.value = withSpring(1);
        toastTranslateY.value = withSpring(0);

        // Hide toast after 3 seconds
        setTimeout(() => {
          toastOpacity.value = withSpring(0);
          toastTranslateY.value = withSpring(-50);
          setTimeout(() => setShowQuestCreatedToast(false), 300);
        }, 3000);
      }
      previousRefreshing = state.isRefreshingQuests;
    });

    return unsubscribe;
  }, [toastOpacity, toastTranslateY]);

  useEffect(() => {
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
      () => {
        // Keyboard shown - could add additional logic here if needed
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Keyboard hidden - could add additional logic here if needed
      }
    );

    return () => {
      clearInterval(pulseInterval);
      clearInterval(logoInterval);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [onlineIndicatorScale, logoRotation]);

  // Auto-scroll when new messages arrive or when streaming
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isStreaming]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || isStreaming) {
      return;
    }

    // Animate send button
    sendButtonScale.value = withSpring(0.8, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    setInputText('');

    try {
      await sendMessage(text.trim());
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    // Simple confirmation - KISS principle
    Alert.alert(
      'Clear Chat',
      'Start fresh? This will clear all messages and begin a new conversation.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearMessages();
            // Simple feedback - scroll to top smoothly
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }, 200);
          },
        },
      ]
    );
  };

  const handleInputFocus = () => {
    inputFocused.value = withSpring(1);
  };

  const handleInputBlur = () => {
    inputFocused.value = withSpring(0);
  };

  // Animated styles
  const sendButtonAnimatedStyle = useAnimatedStyle(() => {
    const isDisabled = !inputText.trim() || isLoading || isStreaming;
    return {
      transform: [{ scale: sendButtonScale.value }],
      backgroundColor: isDisabled
        ? theme.colors.border
        : theme.colors.ctaPrimary,
      opacity: isDisabled ? 0.6 : 1,
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

  const toastAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: toastOpacity.value,
      transform: [{ translateY: toastTranslateY.value }],
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
                {isRefreshingQuests
                  ? 'Updating quests...'
                  : isStreaming
                    ? 'Typing...'
                    : isLoading
                      ? 'Thinking...'
                      : 'Online • Ready to help'}
              </Text>
            </View>
          </View>
          {/* Simple clear chat button - KISS principle */}
          <TouchableOpacity
            style={[
              styles.clearButton,
              { backgroundColor: theme.colors.inputBackground }
            ]}
            onPress={handleClearChat}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={theme.colors.subtitle} />
          </TouchableOpacity>
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
              <ChatBubble
                message={{
                  id: message.id,
                  text: message.content,
                  isUser: message.sender === 'user',
                  timestamp: message.timestamp,
                  isStreaming: message.isStreaming,
                }}
                isTyping={message.isStreaming && !message.content}
              />
            </Animated.View>
          ))}
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
                onPress={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isLoading || isStreaming}
                activeOpacity={0.8}
              >
                <Send
                  size={20}
                  color={
                    inputText.trim() && !isLoading && !isStreaming
                      ? '#ffffff'
                      : theme.colors.subtitle
                  }
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

      {/* Success Toast */}
      {showQuestCreatedToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: '#10B981',
            },
            toastAnimatedStyle,
          ]}
        >
          <CheckCircle size={20} color="#10B981" />
          <Text style={[styles.toastText, { color: theme.colors.text }]}>
            Quests updated successfully!
          </Text>
        </Animated.View>
      )}
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
});
