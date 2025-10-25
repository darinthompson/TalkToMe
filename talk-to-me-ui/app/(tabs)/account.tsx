import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function AccountTab() {
  const router = useRouter();

  const signOut = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('user_id');
      } else {
        await AsyncStorage.removeItem('user_id');
      }
    } catch {}
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Account</Text>
        <Card>
          <Text style={styles.body}>Manage your profile and settings.</Text>
        </Card>
        <PrimaryButton label="Sign out" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    color: '#101112',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 4,
  },
  body: {
    color: '#6B7280',
    fontSize: 16,
  },
});
