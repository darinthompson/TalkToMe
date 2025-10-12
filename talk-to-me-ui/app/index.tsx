import { useState } from 'react';
import { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
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
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.headerBox}>
        <Image
          source={require('@/assets/images/TalkToMe.png')}
          style={styles.logo}
        />
        <Text style={styles.retroTitle}>TalkToMe.AI</Text>
      </View>
      <View style={styles.formBox}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Username"
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Password"
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonAlt} onPress={() => router.push('/register')}>
          <Text style={styles.buttonAltText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/password-reset')}>
          <Text style={styles.link}>Forgot password? Reset here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 0,
    backgroundColor: '#f7e9a0',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#232946',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#7f5af0',
    backgroundColor: '#fff',
  },
  retroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7f5af0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textShadowColor: '#ff6f61',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  retroSubtitle: {
    fontSize: 18,
    color: '#232946',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: '#f7e9a0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: 340,
    shadowColor: '#7f5af0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#7f5af0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    fontSize: 18,
    color: '#232946',
    backgroundColor: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    shadowColor: '#ff6f61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  inputDark: {
    backgroundColor: '#232946',
    color: '#f7e9a0',
    borderColor: '#ff6f61',
  },
  button: {
    backgroundColor: '#7f5af0',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    shadowColor: '#232946',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  buttonAlt: {
    backgroundColor: '#ff6f61',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    shadowColor: '#7f5af0',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonAltText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  link: {
    color: '#7f5af0',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textDecorationLine: 'underline',
  },
  error: {
    color: '#ff6f61',
    marginTop: 8,
    marginBottom: -8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 16,
  },
  footer: {
    marginTop: 32,
    fontSize: 16,
    color: '#232946',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 0.7,
  },
});