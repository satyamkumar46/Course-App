import { getItemAsync } from '@/lib/secure-storage';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.freeapi.app/api/v1'
).replace(/\/$/, '');

export type ApiError = {
  message: string;
  status?: number;
  userMessage: string;
};

const AUTH_TOKEN_KEY = 'course_app_access_token';
const REFRESH_TOKEN_KEY = 'course_app_refresh_token';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function getUserMessage(err: { message?: string; status?: number }, fallback: string): string {
  const msg = err?.message ?? '';
  if (msg.includes('abort') || msg.includes('timeout')) return 'Request timed out. Please try again.';
  if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) return "Can't connect. Check your internet and try again.";
  if (err?.status && err.status >= 500) return "Server error. Please try again later.";
  if (err?.status && err.status === 401) return 'Session expired. Please sign in again.';
  if (err?.status && err.status === 403) return "You don't have permission to do that.";
  if (err?.status && err.status >= 400 && err.status < 500) return msg || 'Something went wrong. Please try again.';
  return msg || fallback;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getStoredToken(): Promise<string | null> {
  return getItemAsync(AUTH_TOKEN_KEY);
}

async function getStoredRefreshToken(): Promise<string | null> {
  return getItemAsync(REFRESH_TOKEN_KEY);
}

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: { id: string; email: string; username: string };
};

export type RegisterResponse = LoginResponse;

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let lastError: ApiError | null = null;
  const attempt = async (retryIndex: number): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        const msg = data.message as string | undefined;
        const errors = data.errors as Array<Record<string, string>> | undefined;
        const firstError = errors?.[0] ? Object.values(errors[0])[0] : undefined;
        const rawMsg = firstError ?? msg ?? `Request failed (${res.status})`;
        const err: ApiError = {
          message: rawMsg,
          status: res.status,
          userMessage: getUserMessage({ message: rawMsg, status: res.status }, 'Something went wrong. Please try again.'),
        };
        throw err;
      }

      const payload = (data.data ?? data) as T;
      return payload;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e && typeof e === 'object' && 'message' in e && 'userMessage' in e) throw e as ApiError;

      const isAbort = e instanceof Error && (e.name === 'AbortError' || e.message?.includes('abort'));
      const isNetwork = e instanceof TypeError || (e instanceof Error && /fetch|network/i.test(e.message));

      const userMessage = getUserMessage(
        e instanceof Error ? { message: e.message } : {},
        'Something went wrong. Please try again.'
      );
      lastError = {
        message: e instanceof Error ? e.message : String(e),
        status: undefined,
        userMessage,
      };

      const canRetry = (isAbort || isNetwork) && retryIndex < MAX_RETRIES;
      if (canRetry) {
        await delay(RETRY_DELAYS_MS[retryIndex] ?? 4000);
        return attempt(retryIndex + 1);
      }

      throw lastError;
    }
  };

  return attempt(0);
}

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },

  async register(data: {
    email: string;
    password: string;
    username: string;
  }): Promise<RegisterResponse> {
    return request<RegisterResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  async refresh(): Promise<RefreshResponse> {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    return request<RefreshResponse>('/users/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
  },

  async me(): Promise<{ id: string; email: string; username: string }> {
    return request<{ id: string; email: string; username: string }>('/users/me');
  },

  async getRandomUsers(limit = 20, page = 1): Promise<{
    data: Array<{
      id: number;
      name: { first: string; last: string };
      picture: { thumbnail: string; medium: string; large: string };
    }>;
  }> {
    const res = await request<{ data: unknown[] }>(
      `/public/randomusers?limit=${limit}&page=${page}`,
      { skipAuth: true } as RequestInit & { skipAuth?: boolean }
    );
    return res as {
      data: Array<{
        id: number;
        name: { first: string; last: string };
        picture: { thumbnail: string; medium: string; large: string };
      }>;
    };
  },

  async getRandomProducts(limit = 20, page = 1): Promise<{
    data: Array<{
      id: number;
      title: string;
      description: string;
      price: number;
      rating: number;
      thumbnail: string;
      brand: string;
      category: string;
    }>;
  }> {
    const res = await request<{ data: unknown[] }>(
      `/public/randomproducts?limit=${limit}&page=${page}`,
      { skipAuth: true } as RequestInit & { skipAuth?: boolean }
    );
    return res as {
      data: Array<{
        id: number;
        title: string;
        description: string;
        price: number;
        rating: number;
        thumbnail: string;
        brand: string;
        category: string;
      }>;
    };
  },
};
