import { useState } from 'react';
import { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform } from 'react-native';
// Use fetch to call backend API. Use env variable for base URL for team compatibility.
const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

async function loginUser({ username, password }: { username: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  } catch (err) {
    return { error: 'Login failed.' };
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const inputStyle = [
    styles.input,
    isDark && styles.inputDark
  ];
  const titleStyle = [
    styles.title,
    isDark && { color: '#fff' }
  ];
  const linkStyle = [
    styles.link,
    isDark && { color: '#4fc3f7' }
  ];

  const handleLogin = async () => {
    setError('');
    const result = await loginUser({ username, password });
    if (result.error) {
      setError(result.error);
      return;
    }
    // Store user_id globally
    if (typeof window !== 'undefined' && result.id) {
      localStorage.setItem('user_id', result.id); // for web
      console.log('Stored user_id in localStorage:', result.id);
    } else if (result.id) {
      // (globalThis as any).user_id = result.id; // fallback for native
      await AsyncStorage.setItem('user_id', result.id);
      console.log('Stored user_id in globalThis:', result.id);
    }
    router.replace('/main');
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#151718' }]}> 
      <Text style={titleStyle}>Login</Text>
      <TextInput
        style={inputStyle}
        placeholder="Username"
        placeholderTextColor={isDark ? "#aaa" : "#888"}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={inputStyle}
        placeholder="Password"
        placeholderTextColor={isDark ? "#aaa" : "#888"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/password-reset')}>
        <Text style={linkStyle}>Forgot password? Reset here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: '#11181C' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, color: '#11181C', backgroundColor: '#fff' },
  inputDark: { backgroundColor: '#222', color: '#fff' },
  link: { color: '#0a7ea4', marginTop: 16, textAlign: 'center', fontSize: 16 },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0a7ea4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  error: {
    color: '#e74c3c',
    marginTop: 8,
    marginBottom: -8,
    textAlign: 'center',
  },
});