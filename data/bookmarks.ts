import { getItemAsync, setItemAsync } from '@/lib/secure-storage';

const BOOKMARKS_KEY = 'course_app_bookmarks';

export async function getBookmarkedIds(): Promise<string[]> {
  try {
    const json = await getItemAsync(BOOKMARKS_KEY);
    if (!json) return [];
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

export async function toggleBookmark(courseId: string): Promise<boolean> {
  const ids = await getBookmarkedIds();
  const exists = ids.includes(courseId);
  if (exists) {
    await setItemAsync(BOOKMARKS_KEY, JSON.stringify(ids.filter((id) => id !== courseId)));
    return false;
  }
  await setItemAsync(BOOKMARKS_KEY, JSON.stringify([...ids, courseId]));
  return true;
}

export async function isBookmarked(courseId: string): Promise<boolean> {
  const ids = await getBookmarkedIds();
  return ids.includes(courseId);
}
