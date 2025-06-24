import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { LogoImage } from '@/components/onboarding/LogoImage';
import { useTypewriter } from '@/hooks/useTypewriter';
import { TypingCursor } from '@/components/ui/TypingCursor';
import { useEffect } from 'react';

interface ChatBubbleProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    isStreaming?: boolean;
  };
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping = false }: ChatBubbleProps) {
  const { theme } = useTheme();

  // Typing indicator animation
  const typingScale1 = useSharedValue(1);
  const typingScale2 = useSharedValue(1);
  const typingScale3 = useSharedValue(1);

  // Typewriter effect for AI messages
  const shouldUseTypewriter =
    !message.isUser && (message.isStreaming || isTyping) && message.text;
  const {
    displayText,
    isTyping: isTypewriterActive,
    skipToEnd,
  } = useTypewriter({
    text: message.text || '',
    speed: 20, // Faster typing for better UX
    startDelay: 150,
    naturalPauses: true, // Enable natural pauses
  });

  // Animate typing indicators
  useEffect(() => {
    if (isTyping && !message.text) {
      // Animate the three dots
      const animateDots = () => {
        typingScale1.value = withSequence(
          withDelay(0, withSpring(1.3, { duration: 400 })),
          withSpring(1, { duration: 400 })
        );
        typingScale2.value = withSequence(
          withDelay(200, withSpring(1.3, { duration: 400 })),
          withSpring(1, { duration: 400 })
        );
        typingScale3.value = withSequence(
          withDelay(400, withSpring(1.3, { duration: 400 })),
          withSpring(1, { duration: 400 })
        );
      };

      animateDots();
      const interval = setInterval(animateDots, 1200);
      return () => clearInterval(interval);
    }
  }, [isTyping, message.text]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: typingScale1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: typingScale2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: typingScale3.value }],
  }));

  const renderMessageContent = () => {
    if (isTyping && !message.text) {
      // Show animated typing indicator
      return (
        <View style={styles.typingContainer}>
          <Animated.Text
            style={[
              styles.typingDot,
              { color: theme.colors.subtitle },
              dot1Style,
            ]}
          >
            ●
          </Animated.Text>
          <Animated.Text
            style={[
              styles.typingDot,
              { color: theme.colors.subtitle },
              dot2Style,
            ]}
          >
            ●
          </Animated.Text>
          <Animated.Text
            style={[
              styles.typingDot,
              { color: theme.colors.subtitle },
              dot3Style,
            ]}
          >
            ●
          </Animated.Text>
        </View>
      );
    }

    if (shouldUseTypewriter) {
      // Show typewriter effect with animated cursor
      return (
        <TouchableOpacity onPress={skipToEnd} activeOpacity={0.8}>
          <Text
            style={[
              styles.text,
              message.isUser
                ? styles.userText
                : [styles.zikText, { color: theme.colors.text }],
            ]}
          >
            {displayText}
            <TypingCursor
              isVisible={isTypewriterActive}
              color={theme.colors.text}
              style={styles.cursor}
            />
          </Text>
        </TouchableOpacity>
      );
    }

    // Normal message display
    return (
      <Text
        style={[
          styles.text,
          message.isUser
            ? styles.userText
            : [styles.zikText, { color: theme.colors.text }],
        ]}
      >
        {message.text}
      </Text>
    );
  };

  return (
    <Animated.View
      entering={FadeIn}
      style={[
        styles.container,
        message.isUser ? styles.userContainer : styles.zikContainer,
      ]}
    >
      {!message.isUser && (
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.ctaPrimary + '20',
            },
          ]}
        >
          <LogoImage size={36} />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          message.isUser
            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
            : [
                styles.zikBubble,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ],
        ]}
      >
        {renderMessageContent()}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  zikContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
    borderWidth: 2,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
  },
  userBubble: {
    borderBottomRightRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  zikBubble: {
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: 'white',
    fontFamily: 'Inter-Medium',
  },
  zikText: {
    fontFamily: 'Inter-Regular',
  },
  typingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  typingDot: {
    fontSize: 20,
    marginHorizontal: 2,
    fontFamily: 'Inter-Bold',
  },
  cursor: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
});
