import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

export default function SectionTitle({ style, children, ...rest }: TextProps & { children: React.ReactNode }) {
  return (
    <Text style={[styles.title, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 6,
    marginBottom: 6,
    fontWeight: '700',
    fontSize: 18,
    color: '#111827',
  },
});
