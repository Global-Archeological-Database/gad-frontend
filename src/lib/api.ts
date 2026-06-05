import { auth } from './firebase';
import { ApiError } from '@/types/api';
import type { Artifact, ArtifactListResponse, CreateArtifactPayload, UpdateArtifactPayload } from '@/types/artifact';
import type { UserProfile } from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(response.statusText, response.status, data);
  }

  return response.json();
}

export const artifactsApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<ArtifactListResponse>(`/api/artifacts${searchParams}`);
  },
  get: (id: string) => request<Artifact>(`/api/artifacts/${id}`),
  create: (payload: CreateArtifactPayload) =>
    request<Artifact>('/api/artifacts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateArtifactPayload) =>
    request<Artifact>(`/api/artifacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) =>
    request<void>(`/api/artifacts/${id}`, { method: 'DELETE' }),
  getUploadUrl: (artifactId: string, fileName: string, contentType: string) =>
    request<{ uploadUrl: string; publicUrl: string }>(`/api/artifacts/${artifactId}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }),
};

export const authApi = {
  register: (displayName: string) =>
    request<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),
  getProfile: () => request<UserProfile>('/api/auth/profile'),
  updateProfile: (payload: Partial<Pick<UserProfile, 'display_name' | 'profile_picture_url'>> & { settings?: Partial<UserProfile['settings']> }) =>
    request<UserProfile>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const aiApi = {
  chat: (messages: { role: string; content: string }[], message: string) =>
    request<{ reply: string }>('/api/ai/chatbot', {
      method: 'POST',
      body: JSON.stringify({ messages, message }),
    }),
  analyze: (artifactId: string) =>
    request<{ analysis: string }>(`/api/ai/analyze/${artifactId}`, { method: 'POST' }),
  findSimilar: (artifactId: string) =>
    request<{ similar: Artifact[] }>(`/api/ai/find-similar/${artifactId}`, { method: 'POST' }),
};

export const adminApi = {
  listUsers: () => request<{ users: UserProfile[] }>('/api/admin/users'),
  updateRole: (uid: string, role: 'user' | 'admin') =>
    request<UserProfile>(`/api/admin/users/${uid}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  deleteArtifact: (id: string) =>
    request<void>(`/api/admin/artifacts/${id}`, { method: 'DELETE' }),
};
