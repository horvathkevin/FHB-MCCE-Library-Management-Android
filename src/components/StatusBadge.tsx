import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 'active' | 'inactive' | 'returned' | 'pending' | 'ready' | 'cancelled' | 'overdue';

const COLORS: Record<Status, { bg: string; text: string }> = {
  active: { bg: '#d1fae5', text: '#065f46' },
  inactive: { bg: '#f3f4f6', text: '#6b7280' },
  returned: { bg: '#dbeafe', text: '#1e40af' },
  pending: { bg: '#fef3c7', text: '#92400e' },
  ready: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
  overdue: { bg: '#fee2e2', text: '#991b1b' },
};

interface Props {
  status: Status;
  testID?: string;
}

export function StatusBadge({ status, testID }: Props) {
  const colors = COLORS[status] ?? COLORS.inactive;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]} testID={testID}>
      <Text style={[styles.text, { color: colors.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
