import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export default function Card({ children, style, ...rest }: ViewProps & { children: React.ReactNode }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
});
