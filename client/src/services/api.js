import axios from 'axios';

// Set auth header helper
export const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Auto initialize from localStorage if token exists
const token = localStorage.getItem('tripToken');
if (token) {
  setAuthHeader(token);
}

export const usersAPI = {
  getAll: async () => {
    const { data } = await axios.get('/api/users');
    return data;
  },
};
export const tripsAPI = {
  getAll: async () => {
    const { data } = await axios.get('/api/trips');
    return data;
  },
  getById: async (id) => {
    const { data } = await axios.get(`/api/trips/${id}`);
    return data;
  },
  getOne: async (id) => {
    const { data } = await axios.get(`/api/trips/${id}`);
    return data;
  },
  create: async (tripData) => {
    const { data } = await axios.post('/api/trips', tripData);
    return data;
  },
  update: async (id, tripData) => {
    const { data } = await axios.put(`/api/trips/${id}`, tripData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/api/trips/${id}`);
    return data;
  },
};

export const membersAPI = {
  getAll: async (tripId) => {
    const { data } = await axios.get(`/api/trips/${tripId}/members`);
    return data;
  },
  add: async (tripId, email) => {
    const { data } = await axios.post(`/api/trips/${tripId}/members`, { email });
    return data;
  },
  remove: async (tripId, userId) => {
    const { data } = await axios.delete(`/api/trips/${tripId}/members/${userId}`);
    return data;
  },
  updateRole: async (tripId, userId, role) => {
    const { data } = await axios.put(`/api/trips/${tripId}/members/${userId}/role`, { role });
    return data;
  },
};

export const expensesAPI = {
  getAll: async (tripId) => {
    const { data } = await axios.get(`/api/trips/${tripId}/expenses`);
    return data;
  },
  create: async (tripId, expenseData) => {
    const { data } = await axios.post(`/api/trips/${tripId}/expenses`, expenseData);
    return data;
  },
  update: async (tripId, expenseId, expenseData) => {
    const { data } = await axios.put(`/api/trips/${tripId}/expenses/${expenseId}`, expenseData);
    return data;
  },
  delete: async (tripId, expenseId) => {
    const { data } = await axios.delete(`/api/trips/${tripId}/expenses/${expenseId}`);
    return data;
  },
};

export const itineraryAPI = {
  getAll: async (tripId) => {
    const { data } = await axios.get(`/api/trips/${tripId}/itinerary`);
    return data;
  },
  save: async (tripId, dayData) => {
    const { data } = await axios.post(`/api/trips/${tripId}/itinerary`, dayData);
    return data;
  },
  update: async (tripId, id, dayData) => {
    const { data } = await axios.put(`/api/trips/${tripId}/itinerary/${id}`, dayData);
    return data;
  },
  delete: async (tripId, id) => {
    const { data } = await axios.delete(`/api/trips/${tripId}/itinerary/${id}`);
    return data;
  },
};
