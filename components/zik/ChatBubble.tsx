import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';

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
  return (
    <View style={[styles.container, message.isUser ? styles.userContainer : styles.zikContainer]}>
      {!message.isUser && (
        <View style={styles.avatar}>
          <Sparkles size={16} color="#14b8a6" />
        </View>
      )}
      
      <View style={[styles.bubble, message.isUser ? styles.userBubble : styles.zikBubble]}>
        <Text style={[styles.text, message.isUser ? styles.userText : styles.zikText]}>
          {isTyping ? (
            <Text style={styles.typingText}>●●●</Text>
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
    backgroundColor: '#f0fdfa',
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
    backgroundColor: '#14b8a6',
    borderBottomRightRadius: 4,
  },
  zikBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
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
    color: '#ffffff',
  },
  zikText: {
    color: '#1e293b',
  },
  typingText: {
    color: '#64748b',
    fontFamily: 'Inter-Bold',
  },
});