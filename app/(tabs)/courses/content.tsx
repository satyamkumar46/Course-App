import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApiError } from '@/contexts/api-error-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCourseFromCache } from '@/data/course-cache';
import { getProgressForCourse, setProgress } from '@/data/progress';
import { isPurchased } from '@/data/purchases';
import { generateCourseHTML, type CourseContentData } from '@/lib/course-html-template';
import { api, type ApiError } from '@/lib/api';
import type { ApiCourse } from './index';

const APP_VERSION = '1.0.0';

export default function CourseContentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgressState] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const { setError: setApiError } = useApiError();
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');

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

  const loadCourseState = useCallback(async () => {
    if (!id) return;
    const [isEnrolled, courseProgress] = await Promise.all([
      isPurchased(id),
      getProgressForCourse(id),
    ]);
    setEnrolled(isEnrolled);
    setProgressState(courseProgress);
  }, [id]);

  useEffect(() => {
    fetchCourse();
    loadCourseState();
  }, [fetchCourse, loadCourseState]);

  const handleWebViewMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'continue') {
        if (!enrolled && id) {
          router.back();
        } else {
          const newProgress = Math.min(progress + 25, 100);
          if (id) {
            await setProgress(id, newProgress);
            setProgressState(newProgress);
            webViewRef.current?.injectJavaScript(`
              updateProgress(${newProgress});
              true;
            `);
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [enrolled, id, progress]);

  const injectNativeHeaders = useCallback(() => {
    const headers = {
      'X-App-Platform': Platform.OS,
      'X-App-Version': APP_VERSION,
      'X-Device-Width': width,
      'X-Device-Height': height,
      'X-Color-Scheme': 'light',
      'X-Course-ID': id ?? '',
      'X-Enrolled': enrolled ? 'true' : 'false',
      'X-Progress': progress.toString(),
    };

    const script = `
      window.nativeHeaders = ${JSON.stringify(headers)};
      console.log('Native headers injected:', window.nativeHeaders);
      true;
    `;

    return script;
  }, [width, height, id, enrolled, progress]);

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

  const courseContentData: CourseContentData = {
    id: course.id,
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    category: course.category,
    rating: course.rating,
    price: course.price,
    thumbnail: course.thumbnail,
    progress,
    enrolled,
    theme: 'light',
    userAgent: `CourseApp/${APP_VERSION} (${Platform.OS})`,
    appVersion: APP_VERSION,
    platform: Platform.OS,
  };

  const htmlContent = generateCourseHTML(courseContentData);

  const customHeaders = {
    'X-App-Platform': Platform.OS,
    'X-App-Version': APP_VERSION,
    'X-Course-ID': id ?? '',
    'X-Enrolled': enrolled ? 'true' : 'false',
    'X-Progress': progress.toString(),
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: course.title,
          headerShown: true,
        }}
      />
      <View style={[styles.container, { backgroundColor: background }]}>
        {webViewLoading && (
          <View style={styles.webViewLoader}>
            <ActivityIndicator size="large" color={tint} />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={[styles.webView, { opacity: webViewLoading ? 0 : 1 }]}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => {
            setWebViewLoading(false);
            webViewRef.current?.injectJavaScript(injectNativeHeaders());
          }}
          injectedJavaScript={injectNativeHeaders()}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={true}
          overScrollMode="content"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          cacheEnabled={true}
          incognito={false}
          applicationNameForUserAgent={`CourseApp/${APP_VERSION}`}
          source={{
            html: htmlContent,
            headers: customHeaders,
          }}
        />
      </View>
    </>
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
  webView: {
    flex: 1,
  },
  webViewLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
