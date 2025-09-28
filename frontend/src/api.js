import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000', // Use the full base URL
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('authToken');
            // Force a redirect to the login page to clear all state
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getTasks = () => apiClient.get('/api/tasks/');
export const updateTask = (id, task) => apiClient.put(`/api/tasks/${id}/`, task);
export const createTask = (task) => apiClient.post('/api/tasks/', task);
export const getActivityLogs = (url) => apiClient.get(url);
export const { get, post, put, delete: del } = apiClient;

export default apiClient;