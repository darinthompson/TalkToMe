import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/components/ui/Screen';
import Card from '@/components/ui/Card';

export default function CalendarTab() {
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Calendar</Text>
        <Card>
          <Text style={styles.body}>Connect your calendar to see upcoming events.</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, color: '#101112', fontWeight: '700', marginTop: 4, marginBottom: 4 },
  body: { color: '#6B7280', fontSize: 16 },
});
