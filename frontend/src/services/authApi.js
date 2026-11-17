const defaultApiBaseUrl = typeof window === 'undefined'
  ? 'http://localhost:5000/api'
  : `${window.location.protocol}//${window.location.hostname}:5000/api`
const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiBaseUrl

async function request(path, options = {}) {
  let response
  const isFormData = options.body instanceof FormData
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'The request could not be completed.')
  }
  return data
}

export const authApi = {
  register: (details) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  requestPasswordReset: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyPasswordResetOtp: (email, otp) => request('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  resetPassword: (details) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
}

export const requestApi = {
  create: (details) => request('/requests', {
    method: 'POST',
    body: details instanceof FormData ? details : JSON.stringify(details),
  }),
  myRequests: () => request('/requests/my-requests'),
  get: (id) => request(`/requests/${encodeURIComponent(id)}`),
}

export const userApi = {
  list: () => request('/users'),
  createTeamLead: (details) => request('/users/create-team-lead', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  createTechnician: (details) => request('/users/create-technician', {
    method: 'POST',
    body: JSON.stringify(details),
  }),
  updateStatus: (userId, isActive) => request(`/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  }),
}

export const adminApi = {
  stats: () => request('/admin/dashboard/stats'),
  requests: (filters = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value),
    )
    return request(`/admin/requests${query.size ? `?${query}` : ''}`)
  },
}

export function getApiResourceUrl(path) {
  return new URL(path, API_BASE_URL).toString()
}
