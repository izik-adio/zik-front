import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';

interface TypingCursorProps {
  isVisible: boolean;
  color?: string;
  style?: any;
}

export function TypingCursor({
  isVisible,
  color = '#000',
  style,
}: TypingCursorProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      // Start blinking animation
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      // Stop blinking
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.Text style={[styles.cursor, { color }, style, animatedStyle]}>
      |
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  cursor: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    fontWeight: '300',
  },
});
