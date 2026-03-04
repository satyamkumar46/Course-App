import { getItemAsync, setItemAsync } from '@/lib/secure-storage';

const PROGRESS_KEY = 'course_app_progress';

export type CourseProgress = { courseId: string; progress: number };

export async function getProgress(): Promise<CourseProgress[]> {
  try {
    const json = await getItemAsync(PROGRESS_KEY);
    if (!json) return [];
    return JSON.parse(json) as CourseProgress[];
  } catch {
    return [];
  }
}

export async function setProgress(courseId: string, progress: number): Promise<void> {
  const list = await getProgress();
  const filtered = list.filter((p) => p.courseId !== courseId);
  await setItemAsync(PROGRESS_KEY, JSON.stringify([...filtered, { courseId, progress }]));
}

export async function getProgressForCourse(courseId: string): Promise<number> {
  const list = await getProgress();
  return list.find((p) => p.courseId === courseId)?.progress ?? 0;
}

export async function removeProgress(courseId: string): Promise<void> {
  const list = await getProgress();
  const filtered = list.filter((p) => p.courseId !== courseId);
  await setItemAsync(PROGRESS_KEY, JSON.stringify(filtered));
}
