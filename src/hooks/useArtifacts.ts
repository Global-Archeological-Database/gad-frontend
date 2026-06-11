import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { artifactsApi } from '@/lib/api';
import type { Artifact, ArtifactListResponse } from '@/types/artifact';

export const artifactKeys = {
  all: ['artifacts'] as const,
  lists: () => [...artifactKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) =>
    [...artifactKeys.lists(), filters] as const,
  detail: (id: string) => [...artifactKeys.all, 'detail', id] as const,
};

export function useArtifacts(filters?: Record<string, string>) {
  return useQuery<ArtifactListResponse>({
    queryKey: artifactKeys.list(filters),
    queryFn: () => artifactsApi.list(filters),
    staleTime: 60000,
  });
}

export function useArtifact(id: string | null) {
  return useQuery<Artifact>({
    queryKey: artifactKeys.detail(id ?? ''),
    queryFn: () => artifactsApi.get(id!),
    staleTime: 120000,
    enabled: !!id,
  });
}

export function useCreateArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: artifactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
  });
}

export function useUpdateArtifact(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof artifactsApi.update>[1]) =>
      artifactsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(artifactKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => artifactsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: artifactKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
    },
  });
}

export function useInfiniteArtifacts(filters?: Record<string, string>) {
  return useInfiniteQuery<ArtifactListResponse>({
    queryKey: [...artifactKeys.lists(), filters ?? {}],
    queryFn: ({ pageParam }) => {
      const params = { ...filters };
      if (pageParam) params.pageToken = pageParam as string;
      return artifactsApi.list(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    staleTime: 60000,
  });
}
