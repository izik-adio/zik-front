import React from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface AppInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  style,
  containerStyle,
  ...props
}) => {
  const { theme } = useTheme();

  // Web-specific style to remove outline
  const webNoOutline =
    Platform.OS === 'web' ? { outline: 'none', outlineWidth: 0 } : {};

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          webNoOutline,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.subtitle}
        underlineColorAndroid="transparent"
        selectionColor={theme.colors.ctaPrimary}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    shadowColor: 'transparent',
    elevation: 0,
    backgroundColor: 'transparent',
    // Do not include outlineStyle, outlineWidth, or outlineColor here
  },
});
