import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApiError } from '@/contexts/api-error-context';

export function ApiErrorBanner() {
  const { error, retry, clearError } = useApiError();

  if (!error) return null;

  const handlePress = () => {
    if (retry) {
      clearError();
      retry();
    } else {
      clearError();
    }
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.banner, pressed && styles.pressed]}>
      <MaterialIcons name="error-outline" size={20} color="#fff" />
      <Text style={styles.text} numberOfLines={2}>
        {error.userMessage}
      </Text>
      <Text style={styles.retry}>{retry ? 'Tap to retry' : 'Dismiss'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
    backgroundColor: '#c62828',
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  retry: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
