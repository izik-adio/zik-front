import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  SquareCheck as CheckSquare,
  Sparkles,
  Mountain,
  User,
} from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 90 : 80,
            display: keyboardVisible ? 'none' : 'flex',
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 12,
            marginTop: 4,
          },
          tabBarActiveTintColor: theme.colors.ctaPrimary,
          tabBarInactiveTintColor: theme.colors.tabIconDefault,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ size, color }) => (
              <CheckSquare size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="zik"
          options={{
            title: 'Zik',
            tabBarIcon: ({ size, color }) => (
              <Sparkles size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: 'Goals', // Changed from 'Quests'
            tabBarIcon: ({ size, color }) => (
              <Mountain size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
