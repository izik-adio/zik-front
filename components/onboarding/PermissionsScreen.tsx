import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Bell, CheckCircle } from 'lucide-react-native';

interface PermissionsScreenProps {
  onNext: () => void;
}

export function PermissionsScreen({ onNext }: PermissionsScreenProps) {
  const handleEnable = () => {
    // In a real app, you would request notification permissions here
    onNext();
  };

  const handleMaybeLater = () => {
    onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInUp.delay(200).springify()}
      >
        <View style={styles.iconContainer}>
          <Bell size={32} color="#14b8a6" />
        </View>
        <Text style={styles.title}>Stay motivated with gentle reminders</Text>
        <Text style={styles.subtitle}>
          I can send you friendly notifications to help you stay on track with your quests.
        </Text>
      </Animated.View>

      <Animated.View 
        style={styles.content}
        entering={FadeInUp.delay(400).springify()}
      >
        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <CheckCircle size={20} color="#14b8a6" />
            <Text style={styles.benefitText}>Daily quest reminders</Text>
          </View>
          <View style={styles.benefit}>
            <CheckCircle size={20} color="#14b8a6" />
            <Text style={styles.benefitText}>Celebration messages</Text>
          </View>
          <View style={styles.benefit}>
            <CheckCircle size={20} color="#14b8a6" />
            <Text style={styles.benefitText}>Motivational quotes</Text>
          </View>
        </View>

        <Text style={styles.privacy}>
          You can always change this later in your device settings.
        </Text>
      </Animated.View>

      <Animated.View 
        style={styles.buttonContainer}
        entering={FadeInUp.delay(600).springify()}
      >
        <TouchableOpacity style={styles.primaryButton} onPress={handleEnable}>
          <Text style={styles.primaryButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleMaybeLater}>
          <Text style={styles.secondaryButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  content: {
    marginBottom: 40,
  },
  benefits: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1e293b',
  },
  privacy: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#64748b',
  },
});