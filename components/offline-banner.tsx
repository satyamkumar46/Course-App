import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useNetwork } from '@/contexts/network-context';

export function OfflineBanner() {
  const { isConnected } = useNetwork();

  if (isConnected !== false) return null;

  return (
    <View style={styles.banner}>
      <MaterialIcons name="cloud-off" size={20} color="#fff" />
      <Text style={styles.text}>You're offline. Some features may be limited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e65100',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
