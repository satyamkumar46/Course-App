import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getPurchasedCourseIds } from '@/data/purchases';
import { getProgress } from '@/data/progress';
import { getProfileImageUri, setProfileImageUri } from '@/data/profile-image';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [profileImageUri, setProfileImageUriState] = useState<string | null>(null);
  const tint = useThemeColor({}, 'tint');

  const loadStats = useCallback(async () => {
    const ids = await getPurchasedCourseIds();
    setPurchasedCount(ids.length);
    const progressList = await getProgress();
    const enrolledProgress = progressList.filter((p) => ids.includes(p.courseId));
    const avg =
      enrolledProgress.length > 0
        ? Math.round(
            enrolledProgress.reduce((a, p) => a + p.progress, 0) / enrolledProgress.length
          )
        : 0;
    setAvgProgress(avg);
  }, []);

  const loadProfileImage = useCallback(async () => {
    const uri = await getProfileImageUri();
    setProfileImageUriState(uri);
  }, []);

  useEffect(() => {
    loadStats();
    loadProfileImage();
  }, [loadStats, loadProfileImage]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await setProfileImageUri(result.assets[0].uri);
      setProfileImageUriState(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={handlePickImage} style={styles.avatarWrapper}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: tint }]}>
                <ThemedText style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() ?? '?'}
                </ThemedText>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: tint }]}>
              <MaterialIcons name="camera-alt" size={16} color="#fff" />
            </View>
          </Pressable>
          <ThemedText type="title" style={styles.name}>
            {user?.name ?? 'User'}
          </ThemedText>
          <ThemedText style={styles.username}>@{user?.username}</ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>

        <View style={styles.stats}>
          <View style={[styles.statCard, { borderColor: tint }]}>
            <ThemedText type="subtitle">Courses Enrolled</ThemedText>
            <ThemedText style={[styles.statValue, { color: tint }]}>{purchasedCount}</ThemedText>
          </View>
          <View style={[styles.statCard, { borderColor: tint }]}>
            <ThemedText type="subtitle">Avg. Progress</ThemedText>
            <ThemedText style={[styles.statValue, { color: tint }]}>{avgProgress}%</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={[styles.linkButton, { borderColor: tint }]}
            onPress={() => router.push('/(tabs)/courses')}>
            <ThemedText style={[styles.linkText, { color: tint }]}>Browse Courses</ThemedText>
          </Pressable>
        </View>

        <Pressable style={[styles.logoutButton, { borderColor: tint }]} onPress={handleLogout}>
          <ThemedText style={[styles.logoutText, { color: tint }]}>Log Out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    marginBottom: 4,
  },
  username: {
    opacity: 0.6,
    fontSize: 14,
    marginBottom: 4,
  },
  email: {
    opacity: 0.5,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  linkButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontWeight: '600',
  },
});
