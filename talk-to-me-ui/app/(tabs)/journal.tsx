import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';

export default function JournalTab() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Journal</Text>
        <Card>
          <Text style={styles.body}>View recent entries and create new ones.</Text>
        </Card>
        <Link href="/journal-entry" asChild>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create new journal entry"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.link}>+ New Entry</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={styles.link}>View History</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, color: '#101112', fontWeight: '700', marginTop: 4, marginBottom: 4 },
  body: { color: '#6B7280', fontSize: 16, marginBottom: 6 },
  link: { color: '#111827', textDecorationLine: 'underline', fontWeight: '700', fontSize: 16, marginTop: 6 },
});
