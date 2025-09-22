import { useState } from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View, Image, Text} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Platform } from 'react-native';
// Use fetch to call backend API. Use env variable for base URL for team compatibility.
const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3001'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'http://127.0.0.1:3001';

async function registerUser({ username, firstName, lastName, email, password }: { username: string; firstName: string; lastName: string; email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE}/api/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, firstName, lastName, email, password })
    });
    return await res.json();
  } catch (err) {
    return { error: 'Registration failed.' };
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!username || !firstName || !lastName || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    setError('');
    const result = await registerUser({ username, firstName, lastName, email, password });
    if (result.error) {
      setError(result.error);
      return;
    }
    // Store user_id globally if returned
    if (typeof window !== 'undefined' && result.id) {
      localStorage.setItem('user_id', result.id); // for web
      console.log('Stored user_id in localStorage:', result.id);
    } else if (result.id) {
      (globalThis as any).user_id = result.id; // fallback for native
      console.log('Stored user_id in globalThis:', result.id);
    }
    router.replace('/main');
  };

  return (
    <ThemedView style={[styles.container, isDark && { backgroundColor: '#151718' }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TalkToMe</Text>
      </View>
      <Image
          source={require('../assets/images/fulllogo_transparent_nobuffer.png')}
          style={styles.logo}
      />
      <ThemedText type="title" style={[styles.title, isDark && { color: '#fff' }]}>Create Account</ThemedText>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Username"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
        placeholderTextColor={isDark ? "#aaa" : "#888"}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="First Name"
        value={firstName}
        autoCapitalize="words"
        onChangeText={setFirstName}
        placeholderTextColor={isDark ? "#aaa" : "#888"}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Last Name"
        value={lastName}
        autoCapitalize="words"
        onChangeText={setLastName}
        placeholderTextColor={isDark ? "#aaa" : "#888"}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholderTextColor={isDark ? "#aaa" : "#888"}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        placeholderTextColor={isDark ? "#aaa" : "#888"}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <ThemedText style={styles.buttonText}>Register</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')}> 
        <ThemedText style={[styles.link, isDark && { color: '#4fc3f7' }]}>Already have an account? Login</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f7f8fa',
    alignItems:'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#11181C',
  },
  input: {
    borderWidth: 0,
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#11181C',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width:500,

  },
  inputDark: {
    backgroundColor: '#222',
    color: '#fff',
  },
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
    width: 500,
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
  link: {
    color: '#0a7ea4',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16
  },
  header: {
    height: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(1,8,11,0.8)',
    position:'absolute',
    top:0,
    zIndex:10,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo:
      {
        width:300,
        height:300,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 40,
        marginTop: 60


      },
});