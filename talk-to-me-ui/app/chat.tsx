import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'https://dia-unshrinking-shonda.ngrok-free.dev';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 110 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={aiTyping ? [...messages, { role: "ai", content: typingText, timestamp: Date.now() }] : messages}
            renderItem={renderItem}
            keyExtractor={(_, idx) => String(idx)}
            contentContainerStyle={{ padding: 12, flexGrow: 1, justifyContent: "flex-end", paddingBottom: 100 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              editable={!aiTyping}
              multiline
              placeholderTextColor="#555"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={aiTyping || !input.trim()}
              style={styles.sendBtn}
            >
              <Text style={styles.sendBtnText}>{aiTyping ? "..." : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#232946',
  },
  list: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#7f5af0',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
    shadowColor: '#7f5af0',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  aiBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 16,
    color: '#232946',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderColor: '#555',
    backgroundColor: '#f7f7f7',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 140,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sendBtn: {
    marginLeft: 12,
    backgroundColor: '#7f5af0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#7f5af0',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 6,
  },
  typingBubble: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  typingDots: {
    color: '#0a7ea4',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
