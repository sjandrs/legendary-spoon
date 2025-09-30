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

// --- Accounting API ---
export const getLedgerAccounts = () => apiClient.get('/api/ledger-accounts/');
export const createLedgerAccount = (data) => apiClient.post('/api/ledger-accounts/', data);
export const updateLedgerAccount = (id, data) => apiClient.put(`/api/ledger-accounts/${id}/`, data);
export const deleteLedgerAccount = (id) => apiClient.delete(`/api/ledger-accounts/${id}/`);

export const getJournalEntries = () => apiClient.get('/api/journal-entries/');
export const createJournalEntry = (data) => apiClient.post('/api/journal-entries/', data);
export const updateJournalEntry = (id, data) => apiClient.put(`/api/journal-entries/${id}/`, data);
export const deleteJournalEntry = (id) => apiClient.delete(`/api/journal-entries/${id}/`);

export const getWorkOrders = () => apiClient.get('/api/work-orders/');
export const createWorkOrder = (data) => apiClient.post('/api/work-orders/', data);
export const updateWorkOrder = (id, data) => apiClient.put(`/api/work-orders/${id}/`, data);
export const deleteWorkOrder = (id) => apiClient.delete(`/api/work-orders/${id}/`);

export const getLineItems = () => apiClient.get('/api/line-items/');
export const createLineItem = (data) => apiClient.post('/api/line-items/', data);
export const updateLineItem = (id, data) => apiClient.put(`/api/line-items/${id}/`, data);
export const deleteLineItem = (id) => apiClient.delete(`/api/line-items/${id}/`);

export const getPayments = () => apiClient.get('/api/payments/');
export const createPayment = (data) => apiClient.post('/api/payments/', data);
export const updatePayment = (id, data) => apiClient.put(`/api/payments/${id}/`, data);
export const deletePayment = (id) => apiClient.delete(`/api/payments/${id}/`);

// --- Phase 2 Features ---
// Time Tracking
export const getTimeEntries = () => apiClient.get('/api/time-entries/');
export const createTimeEntry = (data) => apiClient.post('/api/time-entries/', data);
export const updateTimeEntry = (id, data) => apiClient.put(`/api/time-entries/${id}/`, data);
export const deleteTimeEntry = (id) => apiClient.delete(`/api/time-entries/${id}/`);

// Projects (for time tracking)
export const getProjects = () => apiClient.get('/api/tasks/');

// Warehouse Management
export const getWarehouses = () => apiClient.get('/api/warehouses/');
export const createWarehouse = (data) => apiClient.post('/api/warehouses/', data);
export const updateWarehouse = (id, data) => apiClient.put(`/api/warehouses/${id}/`, data);
export const deleteWarehouse = (id) => apiClient.delete(`/api/warehouses/${id}/`);

// Analytics
export const getAnalyticsData = () => apiClient.get('/api/analytics-data/');
export const getDashboardData = () => apiClient.get('/api/dashboard-data/');

// Email Communication
export const sendEmail = (data) => apiClient.post('/api/send-email/', data);

// Warehouse Items
export const getWarehouseItems = () => apiClient.get('/api/warehouse-items/');
export const createWarehouseItem = (data) => apiClient.post('/api/warehouse-items/', data);
export const updateWarehouseItem = (id, data) => apiClient.put(`/api/warehouse-items/${id}/`, data);
export const deleteWarehouseItem = (id) => apiClient.delete(`/api/warehouse-items/${id}/`);

// Invoice Generation
export const generateWorkOrderInvoice = (workOrderId, data) => apiClient.post(`/api/workorders/${workOrderId}/generate-invoice/`, data);
export const getOverdueInvoices = () => apiClient.get('/api/invoices/overdue/');

// Enhanced Email Communication
export const sendInvoiceEmail = (invoiceId) => apiClient.post(`/api/invoices/${invoiceId}/send-email/`);
export const sendOverdueReminders = () => apiClient.post('/api/invoices/send-overdue-reminders/');

// Enhanced Analytics
export const getDashboardAnalytics = () => apiClient.get('/api/analytics/dashboard/');
export const getTaxReport = (year) => apiClient.get('/api/tax-report/', { params: { year } });

export default apiClient;
