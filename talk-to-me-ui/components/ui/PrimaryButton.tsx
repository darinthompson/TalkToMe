import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

type Props = TouchableOpacityProps & { label: string };

export default function PrimaryButton({ label, style, ...rest }: Props) {
  return (
    <TouchableOpacity style={[styles.btn, style]} activeOpacity={0.9} {...rest}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
