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
    : process.env.EXPO_PUBLIC_API_BASE_IOS || "https://dia-unshrinking-shonda.ngrok-free.dev";

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
    <View style={styles.container}>
      <View style={styles.retroBg} />
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
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 0,
    backgroundColor: "#232946",
    alignItems: "center",
    overflow: "visible",
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    alignSelf: "center",
    color: "#f7e9a0",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textShadowColor: '#ff6f61',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
  },
  card: {
    borderWidth: 2,
    borderColor: "#7f5af0",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    backgroundColor: "#f7e9a0",
    width: 420,
    maxWidth: "90%",
    alignSelf: "center",
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    overflow: "visible",
  },
  date: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    alignSelf: "flex-start",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  mood: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#ff6f61",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 16,
  },
  preview: {
    marginBottom: 4,
    color: "#232946",
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
  },
  empty: {
    color: "#fff",
    fontSize: 18,
    marginTop: 40,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textAlign: "center",
  },
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

const markdownStyles = {
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