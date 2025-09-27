import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator,ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

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
  // Retrieve user_id from localStorage (web) or globalThis (native)
  const [userId, setUserId] = useState('');

  useEffect(() => {
    let id = '';
    if (typeof window !== 'undefined') {
      id = localStorage.getItem('user_id') || '';
      console.log('Loaded user_id from localStorage:', id);
    } else {
      id = (globalThis as any).user_id || '';
      console.log('Loaded user_id from globalThis:', id);
    }
    setUserId(id);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setAiResponse('');
    setMood('');
    try {
      console.log('Submitting journal:', { user_id: userId, journal_text: journal });
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
  const renderLines = () => {
    return Array.from({ length: 10 }, (_, i) => (
        <View key={i} style={styles.line} />
    ));
  };
  return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.overlay}>
          <Text style={styles.title}>Write Your Journal Entry</Text>
          <View style={styles.journalWrapper}>
            <View style={styles.lineLayer}>{renderLines()}</View>
            <TextInput
                style={styles.input}
                placeholder="How are you feeling today? Write your thoughts..."
                multiline
                value={journal}
                onChangeText={setJournal}
                placeholderTextColor="#888"
            />
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/main')}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Journal'}</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {aiResponse ? (
              <View style={styles.responseBox}>
                <Text style={styles.responseTitle}>AI Response:</Text>
                <Text style={styles.responseText}>{aiResponse}</Text>
                <Text style={styles.mood}>Mood: {mood}</Text>
              </View>
          ) : null}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, color:'#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color:'#ffffff',  },
  input: { borderWidth: 1, borderColor: '#ffffff', borderRadius: 12, padding: 16, minHeight: 230, fontSize: 16, backgroundColor: '#fff', marginBottom: 16,},
  button: { backgroundColor: '#0a7ea4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  error: { color: '#e74c3c', textAlign: 'center', marginBottom: 8 },
  responseBox: { backgroundColor: '#e3f2fd', borderRadius: 12, padding: 16, marginTop: 16 },
  responseTitle: { fontWeight: 'bold', marginBottom: 4 },
  responseText: { fontSize: 16, marginBottom: 8 },
  mood: { fontStyle: 'italic', color: '#0a7ea4' },
  journalWrapper: {
    position: 'relative',
    height: 240,
    marginBottom: 16,
  },
  lineLayer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 0,
  },
  line: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 22,
  },
  overlay: {
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
  },

  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
});
