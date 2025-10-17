import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';

interface JournalEntryScreenProps { route?: any }

export default function JournalEntryScreen({ route }: JournalEntryScreenProps) {
  const router = useRouter();
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [mood, setMood] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  // Use the same API base resolution as legacy app/journal.tsx so mood is stored in Supabase
  const API_BASE =
    Platform.OS === 'android'
      ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
      : Platform.OS === 'web'
        ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
        : process.env.EXPO_PUBLIC_API_BASE_IOS || 'https://dia-unshrinking-shonda.ngrok-free.dev';

  useEffect(() => {
    (async () => {
      let id = '';
      try {
        if (Platform.OS === 'web') {
          id = localStorage.getItem('user_id') || '';
        } else {
          id = (await AsyncStorage.getItem('user_id')) || '';
        }
      } catch (e) {
        console.error('Error fetching user_id:', e);
      }
      setUserId(id);
    })();
  }, []);

  const handleAnalyze = async () => {
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
        // Best-effort: persist last mood locally so Home can update instantly on back nav
        try {
          if (userId) {
            const key = `last_mood_${userId}`;
            if (Platform.OS === 'web') {
              localStorage.setItem(key, String(data.mood ?? ''));
            } else {
              await AsyncStorage.setItem(key, String(data.mood ?? ''));
            }
          }
        } catch {}
      }
    } catch (err) {
      setError('Failed to submit journal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ gap: 10 }}>
          <Text style={styles.title}>New Journal Entry</Text>
          <Card>
            <TextInput
              style={styles.input}
              placeholder="How are you feeling today?"
              multiline
              value={journal}
              onChangeText={setJournal}
            />
          </Card>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={loading ? 'Analyzing…' : 'Analyze Mood'} onPress={handleAnalyze} disabled={loading} />
          {aiResponse ? (
            <Card>
              <Markdown>{aiResponse}</Markdown>
              {mood ? <Text style={{ marginTop: 8, color: '#6B7280' }}>Mood: {mood}</Text> : null}
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, color: '#101112', fontWeight: '700' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, minHeight: 140, padding: 10, color: '#111827' },
  error: { color: '#B91C1C', marginTop: 8 },
});