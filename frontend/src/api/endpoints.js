import apiClient from './client';

export const authAPI = {
  login: (username, password) =>
    apiClient.post('/token/', { username, password }),
  
  register: (userData) =>
    apiClient.post('/register/', userData),

  registerOwner: async (userData) => {
    try {
      return await apiClient.post('/register-owner/', userData);
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    try {
      return await apiClient.post('/admin/register-owner/', userData);
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    return apiClient.post('/register-owner', userData);
  },
  
  me: () => apiClient.get('/users/me/'),
  
  getProfile: () => apiClient.get('/profiles/'),
};

export const restaurantAPI = {
  list: () => apiClient.get('/restaurants/'),
  
  create: (data) => apiClient.post('/restaurants/', data),
  
  get: (id) => apiClient.get(`/restaurants/${id}/`),
  
  update: (id, data) => apiClient.put(`/restaurants/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/restaurants/${id}/`),
  
  myRestaurants: () => apiClient.get('/restaurants/my_restaurants/'),
};

export const visioniaAPI = {
  list: () => apiClient.get('/visiinias/'),
  
  create: (data) => apiClient.post('/visiinias/', data),
  
  get: (id) => apiClient.get(`/visiinias/${id}/`),
  
  update: (id, data) => apiClient.put(`/visiinias/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/visiinias/${id}/`),
  
  byRestaurant: (restaurantId) =>
    apiClient.get('/visiinias/by_restaurant/', {
      params: { restaurant_id: restaurantId },
    }),
};

export const bookingAPI = {
  list: () => apiClient.get('/bookings/'),
  
  create: (data) => apiClient.post('/bookings/', data),
  
  get: (id) => apiClient.get(`/bookings/${id}/`),
  
  myBookings: () => apiClient.get('/bookings/my_bookings/'),
  
  confirm: (id) => apiClient.post(`/bookings/${id}/confirm/`),
  
  complete: (id) => apiClient.post(`/bookings/${id}/complete/`),
  
  cancel: (id) => apiClient.post(`/bookings/${id}/cancel/`),
};

export const userAPI = {
  list: () => apiClient.get('/users/'),
  
  get: (id) => apiClient.get(`/users/${id}/`),

  delete: (id) => apiClient.delete(`/users/${id}/admin_delete/`),
};
