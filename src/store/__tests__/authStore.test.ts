import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types/user';

const mockUser: UserProfile = {
  uid: 'user-123',
  email: 'test@example.com',
  display_name: 'Test User',
  profile_picture_url: null,
  role: 'user',
  created_at: '2026-01-01T00:00:00Z',
  settings: {
    show_name_publicly: true,
    theme: 'light',
  },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isInitialized: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isInitialized).toBe(false);
  });

  it('should set user', () => {
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });

  it('should set user to null', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('should set initialized state', () => {
    useAuthStore.getState().setInitialized(true);
    expect(useAuthStore.getState().isInitialized).toBe(true);

    useAuthStore.getState().setInitialized(false);
    expect(useAuthStore.getState().isInitialized).toBe(false);
  });

  it('should preserve other state when updating a single field', () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setLoading(false);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
  });
});
