import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { LogoImage } from '@/components/onboarding/LogoImage';

interface ChatBubbleProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
  };
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping = false }: ChatBubbleProps) {
  const { theme } = useTheme();

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
        <Text
          style={[
            styles.text,
            message.isUser
              ? styles.userText
              : [styles.zikText, { color: theme.colors.text }],
          ]}
        >
          {isTyping ? (
            <Text style={[styles.typingText, { color: theme.colors.subtitle }]}>
              ●●●
            </Text>
          ) : (
            message.text
          )}
        </Text>
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
});
