import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';

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
    <View
      style={[
        styles.container,
        message.isUser ? styles.userContainer : styles.zikContainer,
      ]}
    >
      {!message.isUser && (
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.primary + '20' },
          ]}
        >
          <Sparkles size={16} color={theme.colors.primary} />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          message.isUser
            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
            : [styles.zikBubble, { backgroundColor: theme.colors.card }],
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  zikContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  zikBubble: {
    borderBottomLeftRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  zikText: {},
  typingText: {
    fontFamily: 'Inter-Bold',
  },
});
