import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiError } from '@/contexts/api-error-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api, type ApiError } from '@/lib/api';
import { addPurchase, removePurchase, isPurchased } from '@/data/purchases';
import { getBookmarkedIds, isBookmarked, toggleBookmark } from '@/data/bookmarks';
import { showBookmarkMilestoneIfNeeded } from '@/lib/notifications';
import { getProgressForCourse, setProgress } from '@/data/progress';
import { getCourseFromCache } from '@/data/course-cache';
import type { ApiCourse } from './index';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [progress, setProgressState] = useState(0);

  const { setError: setApiError } = useApiError();
  const tint = useThemeColor({}, 'tint');
  const icon = useThemeColor({}, 'icon');
  const scale = useSharedValue(1);

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    const cached = getCourseFromCache(id);
    if (cached) {
      setCourse(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [usersRes, productsRes] = await Promise.all([
        api.getRandomUsers(50, 1),
        api.getRandomProducts(100, 1),
      ]);
      const users = usersRes.data ?? [];
      const products = productsRes.data ?? [];
      const product = products.find((p) => String(p.id) === id);
      if (product) {
        const userIndex = products.indexOf(product) % users.length;
        const instructor = users[userIndex]
          ? `${users[userIndex].name.first} ${users[userIndex].name.last}`
          : 'Instructor';
        const courseData: ApiCourse = {
          id: String(product.id),
          title: product.title,
          description: product.description,
          price: product.price,
          rating: product.rating,
          thumbnail: product.thumbnail,
          category: product.category,
          instructor,
        };
        setCourse(courseData);
      } else {
        setCourse(null);
      }
    } catch (e) {
      setCourse(null);
      if (e && typeof e === 'object' && 'userMessage' in e) {
        setApiError(e as ApiError, () => fetchCourse());
      }
    } finally {
      setLoading(false);
    }
  }, [id, setApiError]);

  const checkEnrolled = useCallback(async () => {
    if (!id) return;
    const ok = await isPurchased(id);
    setEnrolled(ok);
  }, [id]);

  const checkBookmarked = useCallback(async () => {
    if (!id) return;
    const ok = await isBookmarked(id);
    setBookmarked(ok);
  }, [id]);

  const loadProgress = useCallback(async () => {
    if (!id) return;
    const p = await getProgressForCourse(id);
    setProgressState(p);
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    checkEnrolled();
    checkBookmarked();
    loadProgress();
  }, [checkEnrolled, checkBookmarked, loadProgress]);

  const handleEnroll = async () => {
    if (!id || enrolled) return;
    setEnrolling(true);
    scale.value = withSpring(0.95, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    try {
      await addPurchase(id);
      setEnrolled(true);
      setProgressState(0);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!id || !enrolled) return;
    setUnenrolling(true);
    try {
      await removePurchase(id);
      setEnrolled(false);
      setProgressState(0);
    } finally {
      setUnenrolling(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!id) return;
    const newVal = await toggleBookmark(id);
    setBookmarked(newVal);
    if (newVal) {
      const ids = await getBookmarkedIds();
      showBookmarkMilestoneIfNeeded(ids.length);
    }
  };

  const enrollButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!course) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Course not found</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={{ color: tint }}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} contentFit="cover" />
        <Pressable
          style={[styles.bookmarkBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          onPress={handleBookmarkToggle}>
          <MaterialIcons
            name={bookmarked ? 'bookmark' : 'bookmark-border'}
            size={28}
            color={bookmarked ? tint : '#fff'}
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        <ThemedText type="title">{course.title}</ThemedText>
        <ThemedText style={[styles.instructor, { color: icon }]}>by {course.instructor}</ThemedText>
        <View style={styles.meta}>
          <ThemedText style={[styles.metaText, { color: icon }]}>
            ⭐ {course.rating} · {course.category}
          </ThemedText>
        </View>
        <ThemedText style={styles.description}>{course.description}</ThemedText>

        {enrolled ? (
          <View style={styles.enrolledSection}>
            <View style={[styles.enrolledBanner, { backgroundColor: tint }]}>
              <Text style={styles.enrolledText}>✓ Enrolled</Text>
            </View>
            <Pressable
              style={[styles.viewContentButton, { backgroundColor: tint }]}
              onPress={() => router.push(`/(tabs)/courses/content?id=${id}`)}>
              <MaterialIcons name="play-circle-outline" size={24} color="#fff" />
              <Text style={styles.viewContentText}>View Course Content</Text>
            </Pressable>
            <View style={styles.progressSection}>
              <ThemedText type="subtitle">Your progress: {progress}%</ThemedText>
              <View style={styles.progressButtons}>
                {[25, 50, 75, 100].map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.progressBtn, { borderColor: tint }]}
                    onPress={async () => {
                      if (!id) return;
                      await setProgress(id, p);
                      setProgressState(p);
                    }}>
                    <ThemedText style={{ color: tint }}>{p}%</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              style={[styles.unenrollButton, { borderColor: '#ff4444' }]}
              onPress={handleUnenroll}
              disabled={unenrolling}>
              {unenrolling ? (
                <ActivityIndicator color="#ff4444" />
              ) : (
                <ThemedText style={styles.unenrollText}>Unenroll</ThemedText>
              )}
            </Pressable>
          </View>
        ) : (
          <AnimatedPressable
            style={[styles.enrollButton, { backgroundColor: tint }, enrollButtonStyle]}
            onPress={handleEnroll}
            disabled={enrolling}>
            {enrolling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.enrollButtonText}>Enroll — ${course.price.toFixed(2)}</Text>
            )}
          </AnimatedPressable>
        )}
      </View>
    </ScrollView>
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
  backBtn: {
    marginTop: 16,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 220,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: 20,
  },
  instructor: {
    marginTop: 4,
    fontSize: 16,
  },
  meta: {
    marginTop: 12,
  },
  metaText: {
    fontSize: 14,
  },
  description: {
    marginTop: 20,
    lineHeight: 24,
  },
  enrollButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  enrolledSection: {
    marginTop: 24,
  },
  enrolledBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressSection: {
    marginTop: 16,
  },
  progressButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  progressBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  enrolledText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  unenrollButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  unenrollText: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 16,
  },
  viewContentButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewContentText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
