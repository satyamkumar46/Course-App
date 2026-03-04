import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';
import { getProfileImageUri } from '@/data/profile-image';
import { Colors } from '@/constants/theme';

function HeaderLeft() {
  const { user } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const loadProfileImage = useCallback(async () => {
    const uri = await getProfileImageUri();
    setProfileImageUri(uri);
  }, []);

  useEffect(() => {
    loadProfileImage();
  }, [loadProfileImage]);

  return (
    <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileButton}>
      {profileImageUri ? (
        <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
      ) : (
        <View style={[styles.profilePlaceholder, { backgroundColor: tint }]}>
          <ThemedText style={styles.profileInitial}>
            {user?.username?.charAt(0).toUpperCase() ?? '?'}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

function HeaderRight() {
  const tint = useThemeColor({}, 'tint');

  return (
    <Pressable onPress={() => router.push('/(tabs)/bookmarks')} style={styles.bookmarkButton}>
      <MaterialIcons name="bookmark" size={26} color={tint} />
    </Pressable>
  );
}

export default function CoursesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: Platform.OS === 'ios',
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Courses',
          headerShown: true,
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <HeaderRight />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Course Details', headerShown: true }} />
      <Stack.Screen name="content" options={{ title: 'Course Content', headerShown: true }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
