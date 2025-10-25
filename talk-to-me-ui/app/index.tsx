import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import API_BASE from '@/utils/api';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PrimaryButton from '@/components/ui/PrimaryButton';

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

  const handleLogin = async () => {
    setError('');
    const result = await loginUser({ username, password });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.id) {
      if (Platform.OS === 'web') {
        localStorage.setItem('user_id', result.id);
      } else {
        await AsyncStorage.setItem('user_id', result.id);
      }
    }
    router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
        {error ? (
          <Card style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
            <Text style={{ color: '#991B1B' }}>{error}</Text>
          </Card>
        ) : null}
        <Card style={{ gap: 10 }}>
          <Input placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
          <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <PrimaryButton label="Sign In" onPress={handleLogin} />
        </Card>
        <Text onPress={() => router.push('/register')} style={styles.link}>Create an account</Text>
        <Text onPress={() => router.push('/password-reset')} style={styles.link}>Forgot your password?</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, color: '#101112', fontWeight: '700' },
  subtitle: { color: '#6B7280', marginTop: 4 },
  link: {
    color: '#111827',
    marginTop: 12,
    textAlign: 'left',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  error: { color: '#B91C1C', marginTop: 8, fontSize: 16 },
});