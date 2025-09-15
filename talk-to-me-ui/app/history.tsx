import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Entry = {
  created_at: string;
  id: string;
  user_id: string;
  user_journal: string;
  user_mood: number;
  user_response?: string;
};

const API_BASE =
  Platform.OS === "android"
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || "http://10.0.2.2:3001"
    : Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_API_BASE_WEB || "http://localhost:3000"
    : process.env.EXPO_PUBLIC_API_BASE_IOS || "http://127.0.0.1:3001";

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const userId =
        Platform.OS === "web"
          ? localStorage.getItem("user_id")
          : await AsyncStorage.getItem("user_id");

      if (!userId) return;

      try {
        const res = await fetch(`${API_BASE}/api/journal/fetch-mood-history/${userId}`, {
          signal: ctrl.signal,
        });
      const json = await res.json();
      console.log("RAW JSON:", json);

      // 👇 Adjust here: pick out the array property
      const arr = Array.isArray(json) ? json : json.data ?? [];
      setEntries(arr);
      } catch (e) {
        console.error("Fetch failed:", e);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const renderItem = ({ item }: { item: Entry }) => (
    <View style={styles.card}>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
      <Text>Mood: {item.user_mood}</Text>
      <Text>Journal: {item.user_journal}</Text>
      {item.user_response ? (
        <Text>Response: {item.user_response}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No entries yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  date: { fontSize: 12, color: "#666", marginBottom: 6 },
});
