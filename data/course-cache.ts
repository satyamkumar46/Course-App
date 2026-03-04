import type { ApiCourse } from '@/app/(tabs)/courses/index';

const cache = new Map<string, ApiCourse>();

export function setCourseCache(course: ApiCourse): void {
  cache.set(course.id, course);
}

export function getCourseFromCache(id: string): ApiCourse | undefined {
  return cache.get(id);
}
