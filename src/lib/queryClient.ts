import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,          // 5 minutes — data is "fresh" for 5 min
      gcTime: 30 * 60 * 1000,             // Keep in cache for 30 minutes
      retry: 2,                            // Retry failed requests twice
      retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,         // Don't refetch when user switches tabs
    },
  },
})
