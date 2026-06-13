import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  message: string;
  testID?: string;
}

export function EmptyState({ message, testID }: Props) {
  return (
    <View style={styles.container} testID={testID ?? 'empty-state'}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  text: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
});
