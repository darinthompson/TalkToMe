import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { registerUser } from './utils/supabaseClient';

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
    router.replace('/main');
  };

  return (
    <ThemedView style={[styles.container, isDark && { backgroundColor: '#151718' }]}> 
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
});