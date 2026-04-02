import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('safenet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('safenet_token');
      localStorage.removeItem('safenet_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  getMe:    ()     => API.get('/auth/me'),
  updateFCMToken: (fcmToken) => API.patch('/auth/fcm-token', { fcmToken }),
  updateSettings: (settings) => API.patch('/auth/settings', settings),
  changePassword: (data)     => API.patch('/auth/change-password', data),
};

// ── SOS ──────────────────────────────────────────────────────────
export const sosAPI = {
  trigger:   (data) => API.post('/sos/trigger', data),
  resolve:   (id, note) => API.patch(`/sos/${id}/resolve`, { note }),
  cancel:    (id)   => API.patch(`/sos/${id}/cancel`),
  getActive: ()     => API.get('/sos/active'),
  getHistory:()     => API.get('/sos/history'),
  getById:   (id)   => API.get(`/sos/${id}`),
};

// ── Contacts ─────────────────────────────────────────────────────
export const contactsAPI = {
  getAll:   ()           => API.get('/contacts'),
  add:      (data)       => API.post('/contacts', data),
  update:   (id, data)   => API.patch(`/contacts/${id}`, data),
  delete:   (id)         => API.delete(`/contacts/${id}`),
  reorder:  (order)      => API.patch('/contacts/reorder', { order }),
};

// ── Location ─────────────────────────────────────────────────────
export const locationAPI = {
  update: (coordinates) => API.patch('/location/update', { coordinates }),
};

// ── Volunteers ───────────────────────────────────────────────────
export const volunteerAPI = {
  register:   ()         => API.patch('/volunteers/register'),
  unregister: ()         => API.delete('/volunteers/unregister'),
  respond:    (sosId)    => API.post(`/volunteers/respond/${sosId}`),
  getNearby:  (lng, lat) => API.get(`/volunteers/nearby?lng=${lng}&lat=${lat}`),
};

export default API;
