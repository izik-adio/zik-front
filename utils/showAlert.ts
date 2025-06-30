import { Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
) {
  if (Platform.OS === 'web') {
    // Use context for web
    const alertContext = (window as any).__alertContext;
    if (alertContext) {
      alertContext.showAlert({ title, message, buttons });
    } else {
      window.alert(`${title}\n${message}`);
    }
  } else {
    // Dynamically import to avoid web issues
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  }
}
