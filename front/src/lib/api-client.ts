import { getSupabase } from "./supabase";

const API_BASE = "/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token expired - try refresh
    const { error } = await getSupabase().auth.refreshSession();
    if (error) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    throw new Error("RETRY");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "APIエラーが発生しました");
  }

  return data;
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.message === "RETRY") {
      // Retry with refreshed token
      const headers = await getAuthHeaders();
      const response = await fetch(url, { ...options, headers });
      return await handleResponse<T>(response);
    }
    throw error;
  }
}

// Spots API
export const spotsApi = {
  list: async (params?: Record<string, string>) => {
    const headers = await getAuthHeaders();
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return fetchWithRetry<unknown>(`${API_BASE}/spots${query}`, { headers });
  },

  markers: async (params?: Record<string, string>) => {
    const headers = await getAuthHeaders();
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return fetchWithRetry<unknown>(`${API_BASE}/spots/markers${query}`, {
      headers,
    });
  },

  get: async (id: string) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/spots/${id}`, { headers });
  },

  create: async (data: Record<string, unknown>) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/spots`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/spots/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/spots/${id}`, {
      method: "DELETE",
      headers,
    });
  },
};

// Categories API
export const categoriesApi = {
  list: async () => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/categories`, { headers });
  },

  create: async (data: Record<string, unknown>) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/categories/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    const headers = await getAuthHeaders();
    return fetchWithRetry<unknown>(`${API_BASE}/categories/${id}`, {
      method: "DELETE",
      headers,
    });
  },
};
