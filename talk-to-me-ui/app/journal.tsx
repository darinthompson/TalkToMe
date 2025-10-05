import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';

interface JournalEntryScreenProps {
  route?: any;
}

const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

export default function JournalEntryScreen({ route }: JournalEntryScreenProps) {
  // Assume user_id is passed via props, context, or global state
  const router = useRouter();
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [mood, setMood] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    let id = '';
    if (typeof window !== 'undefined') {
      id = localStorage.getItem('user_id') || '';
    } else {
      id = (globalThis as any).user_id || '';
    }
    setUserId(id);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setAiResponse('');
    setMood('');
    try {
      const res = await fetch(`${API_BASE}/api/journal/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, journal_text: journal })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAiResponse(data.ai_response);
        setMood(data.mood);
      }
    } catch (err) {
      setError('Failed to submit journal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.retroBg} />
      <Text style={styles.title}>Write Your Journal Entry</Text>
      <TextInput
        style={styles.input}
        placeholder="How are you feeling today? Write your thoughts..."
        multiline
        value={journal}
        onChangeText={setJournal}
        placeholderTextColor="#7f5af0"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Journal'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {aiResponse ? (
        <View style={styles.responseBox}>
          <Text style={styles.responseTitle}>AI Response:</Text>
          <Markdown style={markdownStyles}>{aiResponse}</Markdown>
          <Text style={styles.mood}>Mood: {mood}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#232946',
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textShadowColor: '#ff6f61',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    marginBottom: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 2,
    borderColor: '#ff6f61',
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
    fontSize: 18,
    color: '#232946',
    backgroundColor: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    shadowColor: '#7f5af0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 18,
    width: 340,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#7f5af0',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    width: 340,
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
  error: {
    color: '#ff6f61',
    marginTop: 10,
    marginBottom: -10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 18,
    letterSpacing: 1,
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  responseBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    width: 340,
    shadowColor: '#7f5af0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  responseTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#7f5af0',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  responseText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#232946',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  mood: {
    fontStyle: 'italic',
    color: '#ff6f61',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
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

const markdownStyles = {
  body: {
    color: "#232946",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 16,
    letterSpacing: 1,
  },
  strong: {
    fontWeight: "bold",
    color: "#7f5af0",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  em: {
    fontStyle: "italic",
    color: "#ff6f61",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paragraph: {
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: "#232946",
    fontSize: 16,
  },
  heading1: {
    color: "#f7e9a0",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6,
  },
  heading2: {
    color: "#7f5af0",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 5,
  },
};