const API_BASE = '/api';

export const tokenStorage = {
  get: () => localStorage.getItem('stockflow_token'),
  set: (token) => localStorage.setItem('stockflow_token', token),
  clear: () => localStorage.removeItem('stockflow_token'),
};

export const userStorage = {
  get: () => {
    try {
      const data = localStorage.getItem('stockflow_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: (user) => localStorage.setItem('stockflow_user', JSON.stringify(user)),
  clear: () => localStorage.removeItem('stockflow_user'),
};

async function request(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me', { method: 'GET' }),
  },
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.low_stock_only) query.append('low_stock_only', 'true');
      const qs = query.toString();
      return request(`/products${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/products/${id}`, { method: 'GET' }),
    update: (id, data) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
    adjustStock: (id, delta, note = '') =>
      request(`/products/${id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({ delta: Number(delta), note: note || undefined }),
      }),
  },
  dashboard: {
    stats: () => request('/dashboard/stats', { method: 'GET' }),
    lowStock: () => request('/dashboard/low-stock', { method: 'GET' }),
  },
  settings: {
    get: () => request('/settings', { method: 'GET' }),
    update: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  demo: {
    seed: () => request('/demo/seed', { method: 'POST' }),
  },
};
