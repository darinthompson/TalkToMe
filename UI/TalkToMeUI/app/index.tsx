import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#151718' }]}> 
      <Text style={titleStyle}>Login</Text>
      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor={isDark ? "#aaa" : "#888"}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={inputStyle}
        placeholder="Password"
        placeholderTextColor={isDark ? "#aaa" : "#888"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/main')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/reset-password')}>
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
});