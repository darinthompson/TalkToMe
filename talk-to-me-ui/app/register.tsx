import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

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
    if (typeof window !== 'undefined' && result.id) {
      localStorage.setItem('user_id', result.id);
      console.log('Stored user_id in localStorage:', result.id);
    } else if (result.id) {
      (globalThis as any).user_id = result.id;
      console.log('Stored user_id in globalThis:', result.id);
    }
    router.replace('/main');
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.retroBg} />
      <View style={styles.headerBox}>
        <Text style={styles.retroTitle}>TalkToMe.AI</Text>
        <Text style={styles.retroSubtitle}>Create Your Account</Text>
      </View>
      <View style={styles.formBox}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Username"
          value={username}
          autoCapitalize="none"
          onChangeText={setUsername}
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="First Name"
          value={firstName}
          autoCapitalize="words"
          onChangeText={setFirstName}
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Last Name"
          value={lastName}
          autoCapitalize="words"
          onChangeText={setLastName}
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          placeholderTextColor={isDark ? "#f7e9a0" : "#7f5af0"}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={[styles.link, isDark && { color: '#4fc3f7' }]}>Already have an account? Login</Text>
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
    backgroundColor: '#232946',
    alignItems: 'center',
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#151718',
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
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 32,
    zIndex: 1,
  },
  retroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 3,
    textShadowColor: '#ff6f61',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  retroSubtitle: {
    fontSize: 20,
    color: '#7f5af0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: '#f7e9a0',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 36,
    width: 360,
    shadowColor: '#7f5af0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#7f5af0',
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#ff6f61',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    fontSize: 20,
    color: '#232946',
    backgroundColor: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    shadowColor: '#7f5af0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  inputDark: {
    backgroundColor: '#232946',
    color: '#f7e9a0',
    borderColor: '#ff6f61',
  },
  button: {
    backgroundColor: '#7f5af0',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    shadowColor: '#232946',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#f7e9a0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  link: {
    color: '#7f5af0',
    marginTop: 14,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textDecorationLine: 'underline',
    letterSpacing: 1,
    textShadowColor: '#f7e9a0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  error: {
    color: '#ff6f61',
    marginTop: 10,
    marginBottom: -10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 18,
    letterSpacing: 1,
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    marginTop: 36,
    fontSize: 18,
    color: '#f7e9a0',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.85,
    textShadowColor: '#7f5af0',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});