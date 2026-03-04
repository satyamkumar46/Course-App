import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiError } from '@/contexts/api-error-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useThemeColor } from '@/hooks/use-theme-color';
import { api, type ApiError } from '@/lib/api';
import { getPurchasedCourseIds } from '@/data/purchases';
import { getBookmarkedIds, toggleBookmark } from '@/data/bookmarks';
import { showBookmarkMilestoneIfNeeded } from '@/lib/notifications';

export type ApiCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  thumbnail: string;
  instructor: string;
  category: string;
};

function CourseCard({
  course,
  isPurchased,
  isBookmarked,
  onPress,
  onBookmarkPress,
}: {
  course: ApiCourse;
  isPurchased: boolean;
  isBookmarked: boolean;
  onPress: () => void;
  onBookmarkPress: () => void;
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
            onBookmarkPress();
          }}>
          <MaterialIcons
            name={isBookmarked ? 'bookmark' : 'bookmark-border'}
            size={24}
            color={isBookmarked ? tint : '#fff'}
          />
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

export default function CoursesScreen() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const { horizontalPadding, listGap } = useResponsive();
  const { setError: setApiError } = useApiError();
  const icon = useThemeColor({}, 'icon');

  const fetchCourses = useCallback(async () => {
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
      setCourses(combined);
    } catch (e) {
      setCourses([]);
      if (e && typeof e === 'object' && 'userMessage' in e) {
        setApiError(e as ApiError, () => fetchCourses());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setApiError]);

  const loadPurchases = useCallback(async () => {
    const ids = await getPurchasedCourseIds();
    setPurchasedIds(ids);
  }, []);

  const loadBookmarks = useCallback(async () => {
    const ids = await getBookmarkedIds();
    setBookmarkedIds(ids);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    loadPurchases();
    loadBookmarks();
  }, [loadPurchases, loadBookmarks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
    loadPurchases();
    loadBookmarks();
  }, [fetchCourses, loadPurchases, loadBookmarks]);

  const handleBookmark = useCallback(async (courseId: string) => {
    const added = await toggleBookmark(courseId);
    loadBookmarks();
    if (added) {
      const ids = await getBookmarkedIds();
      showBookmarkMilestoneIfNeeded(ids.length);
    }
  }, [loadBookmarks]);

  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : courses;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { margin: horizontalPadding, marginBottom: 0, borderColor: icon }]}>
        <MaterialIcons name="search" size={22} color={icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: icon }]}
          placeholder="Search courses, instructors, categories..."
          placeholderTextColor={icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color={icon} />
          </Pressable>
        )}
      </View>
      {searchQuery.trim() !== '' && (
        <ThemedText style={[styles.resultCount, { marginHorizontal: horizontalPadding }]}>
          {filteredCourses.length} {filteredCourses.length === 1 ? 'result' : 'results'} found
        </ThemedText>
      )}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { padding: horizontalPadding, gap: listGap }, filteredCourses.length === 0 && styles.emptyList]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          searchQuery.trim() !== '' ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search-off" size={48} color={icon} />
              <ThemedText style={styles.emptyTitle}>No courses found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Try a different search term
              </ThemedText>
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <ThemedText style={styles.clearSearchText}>Clear Search</ThemedText>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            isPurchased={purchasedIds.includes(item.id)}
            isBookmarked={bookmarkedIds.includes(item.id)}
            onPress={() => {
              const { setCourseCache } = require('@/data/course-cache');
              setCourseCache(item);
              router.push(`/(tabs)/courses/${item.id}`);
            }}
            onBookmarkPress={() => handleBookmark(item.id)}
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  resultCount: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 13,
    opacity: 0.7,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  clearSearchBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  clearSearchText: {
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
