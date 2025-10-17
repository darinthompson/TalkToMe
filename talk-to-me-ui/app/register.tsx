import { useState } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE from '@/utils/api';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PrimaryButton from '@/components/ui/PrimaryButton';

async function registerUser({
  username,
  firstName,
  lastName,
  email,
  password,
}: {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, firstName, lastName, email, password }),
    });
    return await res.json();
  } catch (err) {
    return { error: "Registration failed." };
  }
}

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!username || !firstName || !lastName || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    const result = await registerUser({
      username,
      firstName,
      lastName,
      email,
      password,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.id) {
      try {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          localStorage.setItem("user_id", result.id);
        } else {
          await AsyncStorage.setItem("user_id", result.id);
        }
        console.log("Stored user_id:", result.id);
      } catch (e) {
        console.error("Failed to store user_id:", e);
      }
    }

    router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>It only takes a minute</Text>
        </View>
        {error ? (
          <Card style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
            <Text style={{ color: '#991B1B' }}>{error}</Text>
          </Card>
        ) : null}
        <Card style={{ gap: 10 }}>
          <Input placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
          <Input placeholder="First Name" autoCapitalize="words" value={firstName} onChangeText={setFirstName} />
          <Input placeholder="Last Name" autoCapitalize="words" value={lastName} onChangeText={setLastName} />
          <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <PrimaryButton label="Register" onPress={handleRegister} />
        </Card>
        <Text onPress={() => router.push('/')} style={styles.link}>Already have an account? Login</Text>
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