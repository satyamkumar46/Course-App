import { getItemAsync, setItemAsync } from '@/lib/secure-storage';
import { setProgress, removeProgress } from './progress';

const PURCHASES_KEY = 'course_app_purchases';

export async function getPurchasedCourseIds(): Promise<string[]> {
  try {
    const json = await getItemAsync(PURCHASES_KEY);
    if (!json) return [];
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

export async function addPurchase(courseId: string): Promise<void> {
  const ids = await getPurchasedCourseIds();
  if (ids.includes(courseId)) return;
  await setItemAsync(PURCHASES_KEY, JSON.stringify([...ids, courseId]));
  await setProgress(courseId, 0);
}

export async function removePurchase(courseId: string): Promise<void> {
  const ids = await getPurchasedCourseIds();
  if (!ids.includes(courseId)) return;
  await setItemAsync(PURCHASES_KEY, JSON.stringify(ids.filter((id) => id !== courseId)));
  await removeProgress(courseId);
}

export async function isPurchased(courseId: string): Promise<boolean> {
  const ids = await getPurchasedCourseIds();
  return ids.includes(courseId);
}
