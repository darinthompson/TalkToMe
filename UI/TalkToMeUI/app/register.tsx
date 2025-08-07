import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function RegisterScreen({ onSubmit }: { onSubmit: () => void }) {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!username || !firstName || !lastName || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        autoCapitalize="words"
        onChangeText={setFirstName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        autoCapitalize="words"
        onChangeText={setLastName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        placeholderTextColor="#888"
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <ThemedText style={styles.buttonText}>Submit</ThemedText>
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
  },
  input: {
    borderWidth: 0,
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
});