import { StyleSheet, TouchableOpacity, View, Platform, Image } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

export default function MainScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.retroBg} />
      <View style={styles.headerBox}>
        <Image
          source={require('@/assets/images/TalkToMe.png')}
          style={styles.logo}
        />
        <ThemedText type="title" style={styles.title}>TalkToMe.AI</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Your personal AI-powered journaling companion.
        </ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/journal')}>
          <ThemedText style={styles.buttonText}>Write Journal Entry</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/history')}>
          <ThemedText style={styles.buttonText}>View Mood History</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/chat')}>
          <ThemedText style={styles.buttonText}>Chat with AI Therapist</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/settings')}>
          <ThemedText style={styles.buttonText}>Settings</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 0,
    backgroundColor: '#232946',
    alignItems: 'center',
    overflow: 'hidden',
  },
  retroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundColor: '#232946',
    opacity: 0.95,
    ...(Platform.OS === 'web'
      ? { background: 'repeating-linear-gradient(135deg, #7f5af0 0px, #7f5af0 12px, #ff6f61 12px, #ff6f61 24px, #f7e9a0 24px, #f7e9a0 36px, #232946 36px, #232946 48px)' }
      : {}),
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 32,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#7f5af0',
    backgroundColor: '#fff',
    shadowColor: '#ff6f61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 3,
    textShadowColor: '#ff6f61',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#7f5af0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: '#f7e9a0',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginTop: 12,
    marginBottom: 12,
    width: 340,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#7f5af0',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    shadowColor: '#232946',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#f7e9a0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 36,
    fontSize: 18,
    color: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.85,
    textShadowColor: '#7f5af0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});