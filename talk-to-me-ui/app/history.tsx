import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

type MoodEntry = {
  id: string;
  dateISO: string; // e.g., "2025-08-20"
  mood: 1 | 2 | 3 | 4 | 5; // 1=😞 ... 5=😊
  note?: string;
};

const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

// Minimal mock data so the page “just works”
const INITIAL_DATA: MoodEntry[] = [
  { id: "1", dateISO: "2025-08-22", mood: 4, note: "Good focus at work." },
  { id: "2", dateISO: "2025-08-21", mood: 3, note: "A bit tired but fine." },
  { id: "3", dateISO: "2025-08-20", mood: 5, note: "Great day! Walk + sun." },
];

const moodToEmoji = (mood: MoodEntry["mood"]) => {
  switch (mood) {
    case 1:
      return "😞";
    case 2:
      return "😕";
    case 3:
      return "😐";
    case 4:
      return "🙂";
    case 5:
      return "😊";
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MoodEntry[]>(INITIAL_DATA);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // const res = await fetch(``)
  })

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate re-fetch; swap or prepend entries here.
    setTimeout(() => {
      // Example: no changes — in real app fetch from backend
      setItems((x) => x.slice());
      setRefreshing(false);
    }, 600);
  }, []);

  const Empty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptySub}>Start by writing your first journal entry.</Text>
    </View>
  );

  const renderItem = ({ item }: { item: MoodEntry }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => {
        // Optional: navigate to a details screen if you add one later
        // router.push({ pathname: "/entry/[id]", params: { id: item.id } });
      }}
    >
      <View style={styles.rowTop}>
        <Text style={styles.dateText}>{formatDate(item.dateISO)}</Text>
        <Text style={styles.moodEmoji}>{moodToEmoji(item.mood)}</Text>
      </View>
      {!!item.note && <Text style={styles.noteText}>{item.note}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood History</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Empty />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fafafa",
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateText: { fontWeight: "600", fontSize: 16 },
  moodEmoji: { fontSize: 22 },
  noteText: { marginTop: 8, color: "#374151" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  emptySub: { color: "#6b7280" },
});