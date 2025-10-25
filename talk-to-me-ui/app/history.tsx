import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Platform, Pressable, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Markdown from "react-native-markdown-display";
import API_BASE from '@/utils/api';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';

type Entry = {
  created_at: string;
  id: string;
  user_id: string;
  user_journal: string;
  user_mood: string;
  user_response?: string;
};


function HistoryCard({ item, expanded, toggleExpand }: { item: Entry, expanded: boolean, toggleExpand: (id: string) => void }) {
  const preview = item.user_journal.length > 80
    ? item.user_journal.slice(0, 80) + "..."
    : item.user_journal;

  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 1.04,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={() => toggleExpand(item.id)}
      onHoverIn={Platform.OS === 'web' ? handlePressIn : undefined}
      onHoverOut={Platform.OS === 'web' ? handlePressOut : undefined}
      onPressIn={Platform.OS !== 'web' ? handlePressIn : undefined}
      onPressOut={Platform.OS !== 'web' ? handlePressOut : undefined}
      style={{ marginBottom: 10 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        <Text style={styles.mood}>Mood: {item.user_mood}</Text>
        <Text style={styles.preview}>
          {expanded ? item.user_journal : preview}
        </Text>
        {expanded && item.user_response && (
          <Markdown style={markdownStyles}>{item.user_response}</Markdown>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      let userId = null;

      try {
        if (Platform.OS === "web") {
          userId = localStorage.getItem("user_id");
        } else {
          userId = await AsyncStorage.getItem("user_id");
        }

        if (!userId) return;

        const res = await fetch(`${API_BASE}/api/journal/fetch-mood-history/${userId}`, {
          signal: ctrl.signal,
        });

        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.data ?? [];
        setEntries(arr);
      } catch (e) {
        console.error("Fetch failed:", e);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Mood History</Text>
        <FlatList
          data={entries}
          keyExtractor={(item, idx) => String(item.id ?? idx)}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <HistoryCard
                item={item}
                expanded={!!expanded[item.id]}
                toggleExpand={toggleExpand}
              />
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#101112', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 12 },
  date: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  mood: { fontWeight: '700', marginBottom: 4, color: '#111827' },
  preview: { marginBottom: 4, color: '#111827', fontSize: 15 },
  empty: { color: '#6B7280', fontSize: 16, marginTop: 20, textAlign: 'center' },
  footer: {
    marginTop: 36,
    fontSize: 18,
    color: "#f7e9a0",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textAlign: "center",
    opacity: 0.85,
    textShadowColor: "#7f5af0",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

const markdownStyles: any = {
  body: {
    color: "#232946",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
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
    fontSize: 15,
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