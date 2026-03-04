import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { getItemAsync, setItemAsync, deleteItemAsync } from '@/lib/secure-storage';

const PROFILE_IMAGE_KEY = 'course_app_profile_image';

export async function getProfileImageUri(): Promise<string | null> {
  try {
    return await getItemAsync(PROFILE_IMAGE_KEY);
  } catch {
    return null;
  }
}

export async function setProfileImageUri(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    await setItemAsync(PROFILE_IMAGE_KEY, uri);
    return;
  }
  try {
    const dest = new File(Paths.document, `profile_${Date.now()}.jpg`);
    const source = new File(uri);
    source.copy(dest);
    await setItemAsync(PROFILE_IMAGE_KEY, dest.uri);
  } catch {
    await setItemAsync(PROFILE_IMAGE_KEY, uri);
  }
}

export async function clearProfileImage(): Promise<void> {
  await deleteItemAsync(PROFILE_IMAGE_KEY);
}
