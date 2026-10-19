import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient }          from '../axios';
import '../interceptors';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAuthStore }       from '@/stores/auth.store';

describe('apiClient Interceptors', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Clear cookies
    document.cookie = 'token=; path=/; max-age=0';
    // Reset stores
    useOnboardingStore.setState({ draftToken: null, currentStep: null, createdAt: null });
    useAuthStore.setState({ isAuthenticated: true, user: { name: 'Test User', email: 'test@example.com' } });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        pathname: '/classes',
        search: '',
        href: 'http://localhost/classes',
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  describe('Request Interceptor', () => {
    it('attaches Authorization Bearer token to normal app endpoints when token cookie is present', async () => {
      document.cookie = 'token=jwt-secret-token-123; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: [{ id: '1', name: 'Class 1' }],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.get('/classes/');

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers.Authorization).toBe('Bearer jwt-secret-token-123');
      expect(capturedConfig!.headers['x-draft-token']).toBeUndefined();
    });

    it('attaches x-school-id header when schoolId is available', async () => {
      document.cookie = 'token=jwt-secret-token-123; path=/';
      document.cookie = 'schoolId=school-uuid-999; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: [{ id: '1', name: 'Class 1' }],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.get('/classes/');

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers['x-school-id']).toBe('school-uuid-999');
    });

    it('does NOT attach Authorization header if cookie value is "undefined" or "null"', async () => {
      document.cookie = 'token=undefined; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.get('/classes/');

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers.Authorization).toBeUndefined();
    });

    it('attaches Authorization Bearer token to POST /classes/create', async () => {
      document.cookie = 'token=jwt-secret-token-456; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: { id: 'cls-1' },
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.post('/classes/create', { schoolLevel: 'primary', gradeLevel: 'Primary 1', gradeSection: 'A' });

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers.Authorization).toBe('Bearer jwt-secret-token-456');
    });

    it('attaches x-draft-token to registration endpoints', async () => {
      useOnboardingStore.setState({ draftToken: 'draft-token-abc' });
      document.cookie = 'token=jwt-token; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.post('/registration/drafts/steps/institution-info', {});

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers['x-draft-token']).toBe('draft-token-abc');
      expect(capturedConfig!.headers.Authorization).toBeUndefined();
    });

    it('does NOT attach draft token or auth token to school-info endpoint', async () => {
      useOnboardingStore.setState({ draftToken: 'draft-token-abc' });
      document.cookie = 'token=jwt-token; path=/';

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      await apiClient.post('/registration/drafts/steps/school-info', {});

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers['x-draft-token']).toBeUndefined();
      expect(capturedConfig!.headers.Authorization).toBeUndefined();
    });

    it('does NOT reject or attach Authorization header to /auth/login even when an expired token cookie is present', async () => {
      // Create an expired JWT token (exp in the past)
      const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.dummy-signature`;
      document.cookie = `token=${expiredToken}; path=/`;

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: { token: 'fresh-token-xyz', user: { id: 'u1' } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const res = await apiClient.post('/auth/login', { email: 'teacher@school.ng', password: 'password123' });

      expect(res.status).toBe(200);
      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers.Authorization).toBeUndefined();
    });

    it('does NOT reject or attach Authorization header to /invites/accept even when an expired token cookie is present', async () => {
      const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.dummy-signature`;
      document.cookie = `token=${expiredToken}; path=/`;

      let capturedConfig: InternalAxiosRequestConfig | null = null;
      apiClient.defaults.adapter = async (config) => {
        capturedConfig = config;
        return {
          data: { email: 'teacher@school.ng', schoolName: 'Greenfield', role: 'teacher' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse;
      };

      const res = await apiClient.get('/invites/accept?token=invite-token-123');

      expect(res.status).toBe(200);
      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor — 401 Session Expiry', () => {
    it('clears auth state, removes cookie, and redirects to /login on 401 from an app endpoint', async () => {
      document.cookie = 'token=expired-jwt; path=/';

      apiClient.defaults.adapter = async (config) => {
        const error = new Error('Request failed with status code 401') as unknown as {
          response: AxiosResponse;
          config: InternalAxiosRequestConfig;
          isAxiosError: boolean;
        };
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          data: { message: 'Invalid or expired token', statusCode: 401 },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        };
        throw error;
      };

      await expect(apiClient.get('/classes/')).rejects.toThrow('Invalid or expired token');

      // Cookie should be cleared
      expect(document.cookie).not.toContain('expired-jwt');
      // Auth store should be reset
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      // Redirect location should be set
      expect(window.location.href).toBe('/login?callbackUrl=%2Fclasses');
    });

    it('does not redirect if 401 comes from /auth/login', async () => {
      window.location.pathname = '/login';
      window.location.href = 'http://localhost/login';

      apiClient.defaults.adapter = async (config) => {
        const error = new Error('Unauthorized') as unknown as {
          response: AxiosResponse;
          config: InternalAxiosRequestConfig;
          isAxiosError: boolean;
        };
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          data: { message: 'Invalid credentials', statusCode: 401 },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        };
        throw error;
      };

      await expect(apiClient.post('/auth/login', { email: 'a@b.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');

      // Should not redirect
      expect(window.location.href).toBe('http://localhost/login');
    });

    it('does not redirect if 401 comes from /invites/accept', async () => {
      window.location.pathname = '/accept-invite';
      window.location.href = 'http://localhost/accept-invite?token=invalid-tok';

      apiClient.defaults.adapter = async (config) => {
        const error = new Error('Invalid or expired invitation token') as unknown as {
          response: AxiosResponse;
          config: InternalAxiosRequestConfig;
          isAxiosError: boolean;
        };
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          data: { message: 'Invalid or expired invitation token', statusCode: 401 },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        };
        throw error;
      };

      await expect(apiClient.get('/invites/accept?token=invalid-tok'))
        .rejects.toThrow('Invalid or expired invitation token');

      // Should not redirect to /login
      expect(window.location.href).toBe('http://localhost/accept-invite?token=invalid-tok');
    });

    it('invalidates session and clears cookies when protected endpoint returns 403 No membership found', async () => {
      document.cookie = 'token=active-token; path=/';
      document.cookie = 'schoolId=school-123; path=/';

      apiClient.defaults.adapter = async (config) => {
        const error = new Error('Forbidden: No membership found for this school') as unknown as {
          response: AxiosResponse;
          config: InternalAxiosRequestConfig;
          isAxiosError: boolean;
        };
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          data: { message: 'Forbidden: No membership found for this school', statusCode: 403 },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
        };
        throw error;
      };

      await expect(apiClient.get('/classes/')).rejects.toThrow('Forbidden: No membership found for this school');

      // Both token and schoolId cookies should be cleared
      expect(document.cookie).not.toContain('active-token');
      expect(document.cookie).not.toContain('school-123');
      // Auth store should be cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      // Redirect to login
      expect(window.location.href).toBe('/login?callbackUrl=%2Fclasses');
    });
  });
});
