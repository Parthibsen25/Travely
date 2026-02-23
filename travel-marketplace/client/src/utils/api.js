// In development, use relative URLs to leverage Vite proxy
// In production, set VITE_API_URL to your backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return '';

  const absolutePattern = /^(https?:)?\/\//i;
  if (absolutePattern.test(pathOrUrl) || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }

  return apiUrl(pathOrUrl);
}

export async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(apiUrl(path), {
      credentials: 'include',
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const message = (payload && payload.message) || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (err) {
    // Network errors or other fetch failures
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw err;
  }
}
