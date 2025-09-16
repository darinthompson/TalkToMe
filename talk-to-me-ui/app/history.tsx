import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Platform, Pressable, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Markdown from "react-native-markdown-display";

type Entry = {
  created_at: string;
  id: string;
  user_id: string;
  user_journal: string;
  user_mood: string;
  user_response?: string;
};

const API_BASE =
  Platform.OS === "android"
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || "http://10.0.2.2:3001"
    : Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_API_BASE_WEB || "http://localhost:3000"
    : process.env.EXPO_PUBLIC_API_BASE_IOS || "http://127.0.0.1:3001";


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
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
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
    <View style={styles.container}>
      <Text style={styles.title}>Mood History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            expanded={!!expanded[item.id]}
            toggleExpand={toggleExpand}
          />
        )}
        ListEmptyComponent={<Text>No entries yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    overflow: "visible",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, alignSelf: "center" },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    backgroundColor: "#f7f8fa",
    width: 420,
    maxWidth: "90%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: "visible",
  },
  date: { fontSize: 13, color: "#666", marginBottom: 6, alignSelf: "flex-start" },
  mood: { fontWeight: "bold", marginBottom: 4 },
  preview: { marginBottom: 4, color: "#222" },
});

const markdownStyles = {
  body: { color: "#222", marginTop: 8 },
  strong: { fontWeight: 700 },
  em: { fontStyle: "italic" },
  paragraph: { marginBottom: 4 },
};