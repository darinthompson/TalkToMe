
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

const CHAT_FILENAME = "chat.txt";
const CHAT_DIR = FileSystem.documentDirectory;
const MAX_HISTORY = 30; // Max chat messages to send to AI

// Helper to get chat file path for a user_id (native only)
const getChatFilePath = (userId: string) => `${CHAT_DIR}${userId}/${CHAT_FILENAME}`;

export type ChatMessage = {
  role: "user" | "ai";
  content: string;
  timestamp: number;
};


export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [journalHistory, setJournalHistory] = useState<string[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Load user_id on mount
  useEffect(() => {
    (async () => {
      let id = "";
      if (Platform.OS === "web") {
        id = localStorage.getItem("user_id") || "";
      } else {
        id = (await AsyncStorage.getItem("user_id")) || "";
      }
      setUserId(id);
    })();
  }, []);


  // Load chat history (web: localStorage, native: FileSystem)
  useEffect(() => {
    if (!userId) return;
    if (Platform.OS === "web") {
      try {
        const text = localStorage.getItem(`chat_${userId}`) || "";
        const arr = text.split("\n").filter(Boolean).map(line => JSON.parse(line));
        setMessages(arr);
      } catch (e) {
        // ignore
      }
    } else {
      (async () => {
        try {
          const path = getChatFilePath(userId);
          const exists = await FileSystem.getInfoAsync(path);
          if (exists.exists) {
            const text = await FileSystem.readAsStringAsync(path);
            const arr = text.split("\n").filter(Boolean).map(line => JSON.parse(line));
            setMessages(arr);
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [userId]);

  // Save chat history (web: localStorage, native: FileSystem)
  useEffect(() => {
    if (!userId) return;
    if (Platform.OS === "web") {
      try {
        const text = messages.map(m => JSON.stringify(m)).join("\n");
        localStorage.setItem(`chat_${userId}`, text);
      } catch (e) {
        // ignore
      }
    } else {
      (async () => {
        try {
          const path = getChatFilePath(userId);
          const dir = path.substring(0, path.lastIndexOf("/"));
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          const text = messages.map(m => JSON.stringify(m)).join("\n");
          await FileSystem.writeAsStringAsync(path, text);
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [messages, userId]);

  // Load journal history for user
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/journal/fetch-mood-history/${userId}`);
        if (res.status === 404) {
          setJournalHistory([]); // fallback: no journal history
          return;
        }
        const data = await res.json();
        // Accept both array or {data: array}
        const arr = Array.isArray(data) ? data : data.data ?? [];
        setJournalHistory(arr.map((entry: any) => entry.user_journal || ""));
      } catch (e) {
        setJournalHistory([]);
      }
    })();
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setAiTyping(true);
    setTypingText("");
    try {
      // Call backend with chat and journal history
      const chatHistory = [...messages.slice(-MAX_HISTORY), userMsg];
      const payload = {
        user_id: userId,
        chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
        journalHistory: Array.isArray(journalHistory) ? journalHistory : [],
      };
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.reply) {
        // Animate AI response typing
        let i = 0;
        const fullText = data.reply;
        setTypingText("");
        function typeNext() {
          i++;
          setTypingText(fullText.slice(0, i));
          if (i < fullText.length) {
            setTimeout(typeNext, fullText[i - 1] === ' ' ? 20 : 12); // faster for letters, slower for spaces
          } else {
            setMessages(prev => [...prev, { role: "ai", content: fullText, timestamp: Date.now() }]);
            setAiTyping(false);
            setTypingText("");
          }
        }
        typeNext();
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't respond right now.", timestamp: Date.now() }]);
      setAiTyping(false);
      setTypingText("");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage, index: number }) => {
    // If this is the last message and AI is typing, show the animated text instead
    if (aiTyping && index === messages.length - 1 && item.role === "ai") {
      return (
        <View style={[styles.bubble, styles.aiBubble]}>
          <Text style={styles.bubbleText}>{typingText}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.bubbleText}>{item.content}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        ref={flatListRef}
        data={aiTyping ? [...messages, { role: "ai", content: typingText, timestamp: Date.now() }] : messages}
        renderItem={renderItem}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {aiTyping && (
        <View style={styles.typingIndicatorRow}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>Therapist is typing</Text>
            <Text style={styles.typingDots}>...</Text>
          </View>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          editable={!loading && !aiTyping}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage} disabled={loading || !input.trim() || aiTyping} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>{loading || aiTyping ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  list: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#aee1f9',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  bubbleText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderColor: '#e3e3e3',
    backgroundColor: '#fafdff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#f2f6fa',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    color: '#222',
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 2,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
  },
  typingBubble: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  typingText: {
    color: '#0a7ea4',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 4,
  },
  typingDots: {
    color: '#0a7ea4',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
