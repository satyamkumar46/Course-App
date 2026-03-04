import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiError } from '@/contexts/api-error-context';
import { getBookmarkedIds, toggleBookmark } from '@/data/bookmarks';
import { getPurchasedCourseIds } from '@/data/purchases';
import { useResponsive } from '@/hooks/use-responsive';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api, type ApiError } from '@/lib/api';
import type { ApiCourse } from './courses';

function CourseCard({
  course,
  isPurchased,
  onPress,
  onRemoveBookmark,
}: {
  course: ApiCourse;
  isPurchased: boolean;
  onPress: () => void;
  onRemoveBookmark: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const icon = useThemeColor({}, 'icon');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} contentFit="cover" />
        <Pressable
          style={[styles.bookmarkBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          onPress={(e) => {
            e.stopPropagation();
            onRemoveBookmark();
          }}>
          <MaterialIcons name="bookmark" size={24} color={tint} />
        </Pressable>
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {course.title}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: icon }]} numberOfLines={1}>
          {course.instructor} · {course.category}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText style={[styles.price, { color: tint }]}>${course.price.toFixed(2)}</ThemedText>
          {isPurchased ? (
            <ThemedText style={[styles.badge, { color: tint }]}>Enrolled</ThemedText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function BookmarksScreen() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [allCourses, setAllCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const { horizontalPadding, listGap } = useResponsive();
  const { setError: setApiError } = useApiError();
  const tint = useThemeColor({}, 'tint');

  const fetchAllCourses = useCallback(async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        api.getRandomUsers(30, 1),
        api.getRandomProducts(30, 1),
      ]);
      const users = usersRes.data ?? [];
      const products = productsRes.data ?? [];
      const combined: ApiCourse[] = products.map((p, i) => ({
        id: String(p.id),
        title: p.title,
        description: p.description,
        price: p.price,
        rating: p.rating,
        thumbnail: p.thumbnail,
        category: p.category,
        instructor: users[i % users.length]
          ? `${users[i % users.length].name.first} ${users[i % users.length].name.last}`
          : 'Instructor',
      }));
      setAllCourses(combined);
      return combined;
    } catch (e) {
      if (e && typeof e === 'object' && 'userMessage' in e) {
        setApiError(e as ApiError, () => fetchAllCourses());
      }
      return [];
    }
  }, [setApiError]);

  const loadBookmarkedCourses = useCallback(async (coursesData?: ApiCourse[]) => {
    try {
      const [ids, purchaseIds] = await Promise.all([
        getBookmarkedIds(),
        getPurchasedCourseIds(),
      ]);
      setBookmarkedIds(ids);
      setPurchasedIds(purchaseIds);
      
      const coursesToFilter = coursesData || allCourses;
      const bookmarked = coursesToFilter.filter((c) => ids.includes(c.id));
      setCourses(bookmarked);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allCourses]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (allCourses.length === 0) {
          setLoading(true);
          const fetchedCourses = await fetchAllCourses();
          await loadBookmarkedCourses(fetchedCourses);
        } else {
          await loadBookmarkedCourses();
        }
      };
      load();
    }, [fetchAllCourses, loadBookmarkedCourses, allCourses.length])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const fetchedCourses = await fetchAllCourses();
    await loadBookmarkedCourses(fetchedCourses);
  }, [fetchAllCourses, loadBookmarkedCourses]);

  const handleRemoveBookmark = useCallback(async (courseId: string) => {
    await toggleBookmark(courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setBookmarkedIds((prev) => prev.filter((id) => id !== courseId));
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (courses.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <MaterialIcons name="bookmark-border" size={64} color={tint} />
        <ThemedText type="subtitle" style={styles.emptyTitle}>No Bookmarks Yet</ThemedText>
        <ThemedText style={styles.emptyText}>
          Bookmark courses you're interested in to see them here
        </ThemedText>
        <Pressable
          style={[styles.browseButton, { backgroundColor: tint }]}
          onPress={() => router.back()}>
          <Text style={styles.browseButtonText}>Browse Courses</Text>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { padding: horizontalPadding, gap: listGap }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            isPurchased={purchasedIds.includes(item.id)}
            onPress={() => {
              const { setCourseCache } = require('@/data/course-cache');
              setCourseCache(item);
              router.push(`/(tabs)/courses/${item.id}`);
            }}
            onRemoveBookmark={() => handleRemoveBookmark(item.id)}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 8,
  },
  cardContent: {
    padding: 12,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontWeight: '700',
    fontSize: 18,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
  },
});
