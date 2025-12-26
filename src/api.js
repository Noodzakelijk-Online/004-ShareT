/**
 * API Client
 * Handles all API communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication API
export const auth = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),

  getCurrentUser: () => apiRequest('/auth/me'),

  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),

  changePassword: (passwordData) => apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),

  deleteAccount: () => apiRequest('/auth/account', {
    method: 'DELETE',
  }),

  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  resetPassword: (token, password) => apiRequest(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),

  verifyEmail: (token) => apiRequest(`/auth/verify-email/${token}`),
};

// Trello API
export const trello = {
  connect: () => apiRequest('/trello/connect'),

  callback: (oauth_token, oauth_verifier) => apiRequest('/trello/callback', {
    method: 'POST',
    body: JSON.stringify({ oauth_token, oauth_verifier }),
  }),

  disconnect: () => apiRequest('/trello/disconnect', {
    method: 'POST',
  }),

  getBoards: () => apiRequest('/trello/boards'),

  getCards: (boardId) => apiRequest(`/trello/boards/${boardId}/cards`),

  getCard: (cardId) => apiRequest(`/trello/cards/${cardId}`),
};

// Shared Links API
export const sharedLinks = {
  create: (linkData) => apiRequest('/shared-links', {
    method: 'POST',
    body: JSON.stringify(linkData),
  }),

  getAll: () => apiRequest('/shared-links'),

  getById: (linkId) => apiRequest(`/shared-links/${linkId}`),

  update: (linkId, updateData) => apiRequest(`/shared-links/${linkId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  }),

  delete: (linkId) => apiRequest(`/shared-links/${linkId}`, {
    method: 'DELETE',
  }),

  getAccessLogs: (linkId) => apiRequest(`/shared-links/${linkId}/access-logs`),
};

// Shared Access API (for recipients)
export const sharedAccess = {
  verifyEmail: (shareId, email) => apiRequest(`/shared-access/${shareId}/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  confirmEmail: (shareId, token) => apiRequest(`/shared-access/${shareId}/confirm-email/${token}`),

  getCard: (shareId, token) => apiRequest(`/shared-access/${shareId}/card?token=${token}`),

  addComment: (shareId, token, commentData) => apiRequest(`/shared-access/${shareId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ token, ...commentData }),
  }),

  uploadAttachment: (shareId, token, formData) => apiRequest(`/shared-access/${shareId}/attachment`, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  }),

  downloadAttachment: (shareId, token, attachmentId) => 
    `${API_BASE_URL}/shared-access/${shareId}/attachment/${attachmentId}?token=${token}`,

  updateDueDate: (shareId, token, dueDate) => apiRequest(`/shared-access/${shareId}/due-date`, {
    method: 'PUT',
    body: JSON.stringify({ token, dueDate }),
  }),
};

// Resource Usage API
export const resources = {
  track: (resourceData) => apiRequest('/resources/track', {
    method: 'POST',
    body: JSON.stringify(resourceData),
  }),

  getUsage: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/resources/usage?${queryString}`);
  },

  getBreakdown: (period) => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/resources/breakdown${queryString}`);
  },

  getByPeriod: (period) => apiRequest(`/resources/period/${period}`),

  getByLink: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest(`/resources/by-link?${params.toString()}`);
  },

  getCurrentPeriod: () => apiRequest('/resources/current-period'),

  exportReport: (period, format = 'json') => {
    const params = new URLSearchParams({ format });
    if (period) params.append('period', period);
    return apiRequest(`/resources/export?${params.toString()}`);
  },
};

// Billing API
export const billing = {
  getAll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/billing?${queryString}`);
  },

  getByPeriod: (period) => apiRequest(`/billing/period/${period}`),

  getCurrent: () => apiRequest('/billing/current'),

  getSummary: () => apiRequest('/billing/summary'),

  create: (period) => apiRequest('/billing/create', {
    method: 'POST',
    body: JSON.stringify({ period }),
  }),

  updateStatus: (billingId, status) => apiRequest(`/billing/${billingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  generateInvoice: (billingId) => apiRequest(`/billing/${billingId}/invoice`, {
    method: 'POST',
  }),

  downloadInvoice: (billingId) => `${API_BASE_URL}/billing/${billingId}/invoice/download`,

  processPayment: (billingId, paymentData) => apiRequest(`/billing/${billingId}/pay`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  requestRefund: (billingId, reason) => apiRequest(`/billing/${billingId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  getPricingRates: () => apiRequest('/billing/pricing-rates'),
};

// GitHub API (if needed)
export const github = {
  push: (repoData) => apiRequest('/github/push', {
    method: 'POST',
    body: JSON.stringify(repoData),
  }),

  getStatus: () => apiRequest('/github/status'),
};

export default {
  auth,
  trello,
  sharedLinks,
  sharedAccess,
  resources,
  billing,
  github,
};

