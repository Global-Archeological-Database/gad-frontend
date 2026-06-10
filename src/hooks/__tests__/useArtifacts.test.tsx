import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useArtifacts,
  useArtifact,
  useCreateArtifact,
  useUpdateArtifact,
  useDeleteArtifact,
} from '@/hooks/useArtifacts';
import type { Artifact, ArtifactListResponse } from '@/types/artifact';

// Mock the api module
vi.mock('@/lib/api', () => ({
  artifactsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockArtifact: Artifact = {
  id: 'artifact-1',
  title: 'Ancient Vase',
  description: 'A beautiful ancient vase',
  age: '2000 years',
  materials: ['Clay'],
  cultural_origin: 'Greek',
  condition: 'Good',
  tags: ['vase', 'ancient'],
  image_url: null,
  model_url: null,
  thumbnail_url: null,
  is_3d: false,
  location: {
    coordinates: { latitude: 37.97, longitude: 23.72 },
    country: 'Greece',
    state: 'Attica',
    city: 'Athens',
    region: 'Southern Europe',
  },
  uploader_id: 'user-1',
  uploader_email: 'user@example.com',
  uploader_name: 'User',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  view_count: 10,
  ai_analysis: null,
  ai_analysis_timestamp: null,
};

const mockListResponse: ArtifactListResponse = {
  artifacts: [mockArtifact],
  count: 1,
  nextPageToken: null,
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch artifacts list without filters', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.list).mockResolvedValue(mockListResponse);

    const { result } = renderHook(() => useArtifacts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockListResponse);
    expect(artifactsApi.list).toHaveBeenCalledWith(undefined);
  });

  it('should fetch artifacts list with filters', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.list).mockResolvedValue(mockListResponse);

    const filters = { country: 'Greece', condition: 'Good' };
    const { result } = renderHook(() => useArtifacts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockListResponse);
    expect(artifactsApi.list).toHaveBeenCalledWith(filters);
  });

  it('should handle API errors', async () => {
    const { artifactsApi } = await import('@/lib/api');
    const error = new Error('Network error');
    vi.mocked(artifactsApi.list).mockRejectedValue(error);

    const { result } = renderHook(() => useArtifacts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});

describe('useArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch a single artifact by id', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.get).mockResolvedValue(mockArtifact);

    const { result } = renderHook(() => useArtifact('artifact-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockArtifact);
    expect(artifactsApi.get).toHaveBeenCalledWith('artifact-1');
  });

  it('should not fetch when id is null', async () => {
    const { artifactsApi } = await import('@/lib/api');

    const { result } = renderHook(() => useArtifact(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(artifactsApi.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const { artifactsApi } = await import('@/lib/api');
    const error = new Error('Not found');
    vi.mocked(artifactsApi.get).mockRejectedValue(error);

    const { result } = renderHook(() => useArtifact('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});

describe('useCreateArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an artifact and invalidate queries', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.create).mockResolvedValue(mockArtifact);

    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateArtifact(), {
      wrapper: createWrapper(queryClient),
    });

    const payload = {
      title: 'New Artifact',
      description: 'A new artifact',
      age: '1000 years',
      materials: ['Stone'],
      cultural_origin: 'Egyptian',
      condition: 'Excellent' as const,
      tags: ['new'],
      image_url: null,
      model_url: null,
      thumbnail_url: null,
      is_3d: false,
      location: null,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(artifactsApi.create).toHaveBeenCalledWith(payload, expect.any(Object));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['artifacts', 'list'] });
  });
});

describe('useUpdateArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update an artifact and update cache', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.update).mockResolvedValue(mockArtifact);

    const queryClient = createQueryClient();
    const setQuerySpy = vi.spyOn(queryClient, 'setQueryData');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateArtifact('artifact-1'), {
      wrapper: createWrapper(queryClient),
    });

    const payload = { title: 'Updated Vase' };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(artifactsApi.update).toHaveBeenCalledWith('artifact-1', payload);
    expect(setQuerySpy).toHaveBeenCalledWith(['artifacts', 'detail', 'artifact-1'], mockArtifact);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['artifacts', 'list'] });
  });
});

describe('useDeleteArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an artifact and remove from cache', async () => {
    const { artifactsApi } = await import('@/lib/api');
    vi.mocked(artifactsApi.delete).mockResolvedValue(undefined);

    const queryClient = createQueryClient();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteArtifact(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('artifact-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(artifactsApi.delete).toHaveBeenCalledWith('artifact-1');
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['artifacts', 'detail', 'artifact-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['artifacts', 'list'] });
  });
});
