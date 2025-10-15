import axios from 'axios';

// Create axios client, but tolerate unit tests that mock axios without .create or interceptors
let apiClient = {};
try {
    apiClient = axios && typeof axios.create === 'function'
        ? axios.create({ baseURL: 'http://localhost:8000' })
        : (axios || {});
} catch {
    // noop: fall back to mocked instance when axios.create is unavailable in tests
    apiClient = axios || {};
}

// If apiClient is not a usable client, create a minimal shim with axios-like API
if (!(apiClient && apiClient.get && apiClient.post && apiClient.put && apiClient.delete)) {
    const base = 'http://localhost:8000';
    apiClient = {
        get: (url, config) => axios.get ? axios.get(url, config) : Promise.resolve({ data: {} }),
        post: (url, data, config) => axios.post ? axios.post(url, data, config) : Promise.resolve({ data: {} }),
        put: (url, data, config) => axios.put ? axios.put(url, data, config) : Promise.resolve({ data: {} }),
        delete: (url, config) => axios.delete ? axios.delete(url, config) : Promise.resolve({ data: {} }),
        interceptors: { request: { use: () => {} }, response: { use: () => {} } },
        defaults: { baseURL: base },
    };
}

// Ensure interceptors objects exist to avoid crashes when axios is mocked
if (!apiClient.interceptors) {
    apiClient.interceptors = { request: { use: () => {} }, response: { use: () => {} } };
}

// Request interceptor (no-op in mocked environments)
if (apiClient.interceptors && apiClient.interceptors.request && typeof apiClient.interceptors.request.use === 'function') {
    apiClient.interceptors.request.use(config => {
        try {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Token ${token}`;
            }
        } catch {
            // noop: localStorage/window may be unavailable in tests
        }
        return config;
    }, error => Promise.reject(error));
}

// Response interceptor to handle 401 errors (guarded for tests)
if (apiClient.interceptors && apiClient.interceptors.response && typeof apiClient.interceptors.response.use === 'function') {
    apiClient.interceptors.response.use(
        response => response,
        error => {
            if (error && error.response && error.response.status === 401) {
                try {
                    if (typeof localStorage !== 'undefined') localStorage.removeItem('authToken');
                    if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
                } catch {
                    // noop: localStorage/window may be unavailable in tests
                }
            }
            return Promise.reject(error);
        }
    );
}

const call = (method, ...args) =>
    apiClient && apiClient[method] ? apiClient[method](...args) : Promise.resolve({ data: {} });

export const get = (...args) => call('get', ...args);
export const post = (...args) => call('post', ...args);
export const put = (...args) => call('put', ...args);
export const del = (...args) => call('delete', ...args);

// Projects API (renamed from Tasks)
// Accept optional endpoint to fetch filtered lists (e.g., overdue/upcoming)
export const getProjects = (url = '/api/projects/') => get(url);
export const updateProject = (id, project) => put(`/api/projects/${id}/`, project);
export const createProject = (project) => post('/api/projects/', project);

export const getActivityLogs = (url) => get(url);

// --- Accounting API ---
export const getLedgerAccounts = () => get('/api/ledger-accounts/');
export const createLedgerAccount = (data) => post('/api/ledger-accounts/', data);
export const updateLedgerAccount = (id, data) => put(`/api/ledger-accounts/${id}/`, data);
export const deleteLedgerAccount = (id) => del(`/api/ledger-accounts/${id}/`);

export const getJournalEntries = () => get('/api/journal-entries/');
export const createJournalEntry = (data) => post('/api/journal-entries/', data);
export const updateJournalEntry = (id, data) => put(`/api/journal-entries/${id}/`, data);
export const deleteJournalEntry = (id) => del(`/api/journal-entries/${id}/`);

export const getWorkOrders = () => get('/api/work-orders/');
export const createWorkOrder = (data) => post('/api/work-orders/', data);
export const updateWorkOrder = (id, data) => put(`/api/work-orders/${id}/`, data);
export const deleteWorkOrder = (id) => del(`/api/work-orders/${id}/`);

export const getLineItems = () => get('/api/line-items/');
export const createLineItem = (data) => post('/api/line-items/', data);
export const updateLineItem = (id, data) => put(`/api/line-items/${id}/`, data);
export const deleteLineItem = (id) => del(`/api/line-items/${id}/`);

export const getPayments = () => get('/api/payments/');
export const createPayment = (data) => post('/api/payments/', data);
export const updatePayment = (id, data) => put(`/api/payments/${id}/`, data);
export const deletePayment = (id) => del(`/api/payments/${id}/`);

// --- Phase 2 Features ---
// Time Tracking
export const getTimeEntries = () => get('/api/time-entries/');
export const createTimeEntry = (data) => post('/api/time-entries/', data);
export const updateTimeEntry = (id, data) => put(`/api/time-entries/${id}/`, data);
export const deleteTimeEntry = (id) => del(`/api/time-entries/${id}/`);

// Projects (for time tracking)
// Align to renamed resource (Task -> Project)
// Note: getProjects is already defined above with optional URL support

// Warehouse Management
export const getWarehouses = () => get('/api/warehouses/');
export const createWarehouse = (data) => post('/api/warehouses/', data);
export const updateWarehouse = (id, data) => put(`/api/warehouses/${id}/`, data);
export const deleteWarehouse = (id) => del(`/api/warehouses/${id}/`);

// Analytics
export const getAnalyticsData = () => get('/api/analytics-data/');
export const getDashboardData = () => get('/api/dashboard-data/');

// Email Communication
export const sendEmail = (data) => post('/api/send-email/', data);

// Warehouse Items
export const getWarehouseItems = () => get('/api/warehouse-items/');
export const createWarehouseItem = (data) => post('/api/warehouse-items/', data);
export const updateWarehouseItem = (id, data) => put(`/api/warehouse-items/${id}/`, data);
export const deleteWarehouseItem = (id) => del(`/api/warehouse-items/${id}/`);

// Utilities — GTIN check digit helper
export const computeGtinCheckDigit = (gtinOrBase) => {
    const params = typeof gtinOrBase === 'string' ? { gtin_base: gtinOrBase } : gtinOrBase;
    return get('/api/utils/gtin/check-digit/', { params });
};

// Invoice Generation
export const generateWorkOrderInvoice = (workOrderId, data) => post(`/api/workorders/${workOrderId}/generate-invoice/`, data);
export const getOverdueInvoices = () => get('/api/invoices/overdue/');

// Enhanced Email Communication
export const sendInvoiceEmail = (invoiceId) => post(`/api/invoices/${invoiceId}/send-email/`);
export const sendOverdueReminders = () => post('/api/invoices/send-overdue-reminders/');

// Enhanced Analytics
export const getDashboardAnalytics = () => get('/api/analytics/dashboard/');
export const getTaxReport = (year) => get('/api/tax-report/', { params: { year } });

// --- Phase 3: Advanced Analytics & AI ---
export const getAdvancedAnalyticsDashboard = () => get('/api/analytics/dashboard-v2/');
// Align to master spec: use GET for CLV and Predict endpoints
export const calculateCustomerLifetimeValue = (contactId) => get(`/api/analytics/clv/${contactId}/`);
export const predictDealOutcome = (dealId) => get(`/api/analytics/predict/${dealId}/`);
export const generateRevenueForecast = (data) => post('/api/analytics/forecast/', data);

// --- Budget V2 ---
export const getCostCenters = () => get('/api/cost-centers/');
export const createCostCenter = (data) => post('/api/cost-centers/', data);
export const updateCostCenter = (id, data) => put(`/api/cost-centers/${id}/`, data);
export const deleteCostCenter = (id) => del(`/api/cost-centers/${id}/`);

export const getBudgetsV2 = (params) => get('/api/budgets-v2/', { params });
export const getBudgetV2 = (id) => get(`/api/budgets-v2/${id}/`);
export const createBudgetV2 = (data) => post('/api/budgets-v2/', data);
export const updateBudgetV2 = (id, data) => put(`/api/budgets-v2/${id}/`, data);
export const deleteBudgetV2 = (id) => del(`/api/budgets-v2/${id}/`);
export const seedBudgetV2Default = (id) => post(`/api/budgets-v2/${id}/seed-default/`);
export const updateBudgetV2Distributions = (id, distributions) => put(`/api/budgets-v2/${id}/distributions/`, { distributions });

// --- Phase 2: Core CRM Features ---
// Accounts Management
export const getAccounts = (params) => get('/api/accounts/', { params });
export const getAccount = (id) => get(`/api/accounts/${id}/`);
export const createAccount = (data) => post('/api/accounts/', data);
export const updateAccount = (id, data) => put(`/api/accounts/${id}/`, data);
export const deleteAccount = (id) => del(`/api/accounts/${id}/`);

// Quotes Management
export const getQuotes = (params) => get('/api/quotes/', { params });
export const getQuote = (id) => get(`/api/quotes/${id}/`);
export const createQuote = (data) => post('/api/quotes/', data);
export const updateQuote = (id, data) => put(`/api/quotes/${id}/`, data);
export const deleteQuote = (id) => del(`/api/quotes/${id}/`);
export const convertQuoteToDeal = (id) => post(`/api/quotes/${id}/convert-to-deal/`);

// Interactions Management
export const getInteractions = (params) => get('/api/interactions/', { params });
export const createInteraction = (data) => post('/api/interactions/', data);

// Project Templates
export const getProjectTemplates = () => get('/api/project-templates/');
export const createProjectTemplate = (data) => post('/api/project-templates/', data);
export const updateProjectTemplate = (id, data) => put(`/api/project-templates/${id}/`, data);

// Certifications
export const getCertifications = () => get('/api/certifications/');
export const createCertification = (data) => post('/api/certifications/', data);

export default apiClient;

// --- Phase 4: Technician & User Management APIs ---
// Technicians
export const getTechnicians = (params) => get('/api/technicians/', { params });
export const getTechnician = (id) => get(`/api/technicians/${id}/`);
export const createTechnician = (data) => post('/api/technicians/', data);
export const updateTechnician = (id, data) => put(`/api/technicians/${id}/`, data);
export const deleteTechnician = (id) => del(`/api/technicians/${id}/`);
export const getAvailableTechnicians = (params) => get('/api/technicians/available/', { params });
export const getTechnicianCertificationsById = (id) => get(`/api/technicians/${id}/certifications/`);
export const getTechnicianPayroll = (id, params) => get(`/api/technicians/${id}/payroll/`, { params });

// Certifications
// Note: getCertifications already exists, extending with additional methods
export const getCertification = (id) => get(`/api/certifications/${id}/`);
export const updateCertification = (id, data) => put(`/api/certifications/${id}/`, data);
export const deleteCertification = (id) => del(`/api/certifications/${id}/`);

// Technician Certifications (join table)
export const getTechnicianCertifications = (params) => get('/api/technician-certifications/', { params });
export const createTechnicianCertification = (data) => post('/api/technician-certifications/', data);
export const updateTechnicianCertification = (id, data) => put(`/api/technician-certifications/${id}/`, data);
export const deleteTechnicianCertification = (id) => del(`/api/technician-certifications/${id}/`);

// Coverage Areas
export const getCoverageAreas = (params) => get('/api/coverage-areas/', { params });
export const getCoverageArea = (id) => get(`/api/coverage-areas/${id}/`);
export const createCoverageArea = (data) => post('/api/coverage-areas/', data);
export const updateCoverageArea = (id, data) => put(`/api/coverage-areas/${id}/`, data);
export const deleteCoverageArea = (id) => del(`/api/coverage-areas/${id}/`);

// Technician Availability
export const getTechnicianAvailability = (params) => get('/api/technician-availability/', { params });
export const getTechnicianAvailabilityById = (id) => get(`/api/technician-availability/${id}/`);
export const createTechnicianAvailability = (data) => post('/api/technician-availability/', data);
export const updateTechnicianAvailability = (id, data) => put(`/api/technician-availability/${id}/`, data);
export const deleteTechnicianAvailability = (id) => del(`/api/technician-availability/${id}/`);

// Enhanced Users (User Hierarchy Management)
export const getEnhancedUsers = (params) => get('/api/enhanced-users/', { params });
export const getEnhancedUser = (id) => get(`/api/enhanced-users/${id}/`);
export const createEnhancedUser = (data) => post('/api/enhanced-users/', data);
export const updateEnhancedUser = (id, data) => put(`/api/enhanced-users/${id}/`, data);
export const deleteEnhancedUser = (id) => del(`/api/enhanced-users/${id}/`);
export const getEnhancedUserSubordinates = (id) => get(`/api/enhanced-users/${id}/subordinates/`);
export const getEnhancedUserHierarchy = (id) => get(`/api/enhanced-users/${id}/hierarchy/`);

// Work Order Assignment & Matching
export const findAvailableTechnicians = (workOrderId, params) => get(`/api/work-orders/${workOrderId}/find-technicians/`, { params });
export const assignTechnicianToWorkOrder = (workOrderId, data) => post(`/api/work-orders/${workOrderId}/assign-technician/`, data);

// --- Auth helpers (align with master spec) ---
export const login = (credentials) => post('/api/login/', credentials);
export const logout = () => post('/api/logout/');
export const getCurrentUser = () => get('/api/user/');
