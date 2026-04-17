import axios from 'axios';

const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || '/api' 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cambill_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('cambill_token');
            localStorage.removeItem('cambill_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
