import { http, HttpResponse } from 'msw';

// Use a host-agnostic prefix so requests to localhost or 127.0.0.1 are intercepted equally
const API_BASE_URL = '*/api';

// Mock data
const mockContacts = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0123',
    company: 'Test Company',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0456',
    company: 'Another Company',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockDeals = [
  {
    id: 1,
    title: 'Big Deal',
    amount: 10000.00,
    stage: 'qualified',
    probability: 80,
    expected_close_date: '2025-12-31',
    contact: mockContacts[0],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockAccounts = [
  {
    id: 1,
    name: 'Enterprise Account',
    company_type: 'business',
    industry: 'Technology',
    annual_revenue: 5000000,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockProjects = [
  {
    id: 1,
    title: 'Website Redesign',
    description: 'Complete website redesign project',
    status: 'active',
    priority: 'high',
    due_date: '2025-06-30',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// Additional mock data for comprehensive API coverage
const mockBudgets = [
  {
    id: 1,
    category: 'Office Supplies',
    period_start: '2025-10-01',
    period_end: '2025-10-31',
    budgeted_amount: 1500.00,
    spent_amount: 875.50,
    remaining_amount: 624.50,
    notes: 'Q4 office supplies budget',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    category: 'Marketing',
    period_start: '2025-11-01',
    period_end: '2025-11-30',
    budgeted_amount: 5000.00,
    spent_amount: 2100.75,
    remaining_amount: 2899.25,
    notes: 'Marketing campaign budget',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    category: 'Travel',
    period_start: '2025-10-01',
    period_end: '2025-10-31',
    budgeted_amount: 875.50,
    spent_amount: 875.50,
    remaining_amount: 0.00,
    notes: 'Travel budget for conferences',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockWarehouses = [
  {
    id: 1,
    name: 'Main Warehouse',
    location: '123 Business St',
    contact_person: 'John Manager',
    phone: '555-0199',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Secondary Storage',
    location: '456 Storage Ave',
    contact_person: 'Jane Supervisor',
    phone: '555-0288',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockWarehouseItems = [
  {
    id: 1,
    name: 'Widget A',
    sku: 'WID-001',
    warehouse: 1,
    quantity: 150,
    minimum_stock: 50,
    unit_cost: 12.50,
    total_value: 1875.00,
    status: 'in_stock',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Widget B',
    sku: 'WID-002',
    warehouse: 1,
    quantity: 25,
    minimum_stock: 30,
    unit_cost: 24.99,
    total_value: 624.75,
    status: 'low_stock',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Component X',
    sku: 'COMP-001',
    warehouse: 2,
    quantity: 200,
    minimum_stock: 100,
    unit_cost: 5.75,
    total_value: 1150.00,
    status: 'in_stock',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockExpenses = [
  {
    id: 1,
    description: 'Office Supplies Purchase',
    amount: 245.67,
    category: 'Office Supplies',
    date: '2025-10-01',
    status: 'approved',
    submitted_by: 1,
    approved_by: 2,
    receipt_url: '/uploads/receipts/receipt1.pdf',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    description: 'Business Travel',
    amount: 1250.00,
    category: 'Travel',
    date: '2025-09-28',
    status: 'pending',
    submitted_by: 1,
    approved_by: null,
    receipt_url: '/uploads/receipts/receipt2.pdf',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const mockPayments = [
  {
    id: 1,
    amount: 2500.00,
    payment_method: 'credit_card',
    payment_date: '2025-10-01',
    invoice_id: 1,
    reference_number: 'PAY-001',
    status: 'completed',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    amount: 1500.00,
    payment_method: 'bank_transfer',
    payment_date: '2025-09-30',
    invoice_id: 2,
    reference_number: 'PAY-002',
    status: 'pending',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// Certifications
const mockCertifications = [
  {
    id: 1,
    name: 'HVAC Certification',
    description: 'Heating, Ventilation, and Air Conditioning certification',
    issuing_authority: 'HVAC Institute',
    validity_period_months: 24,
    required_for_roles: ['HVAC Technician', 'Senior Technician'],
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Electrical Certification',
    description: 'Electrical systems certification',
    issuing_authority: 'Electrical Board',
    validity_period_months: 36,
    required_for_roles: ['Electrician'],
    is_active: true,
    created_at: '2023-02:01T00:00:00Z',
    updated_at: '2023-02:01T00:00:00Z',
  },
];

// Technician Certifications (join records)
const mockTechnicianCertifications = [
  {
    id: 1,
    technician: 1,
    technician_name: 'John Doe',
    certification: {
      id: 1,
      name: 'HVAC Certification',
      category: 'HVAC',
      tech_level: 'Intermediate',
    },
    certification_name: 'HVAC Certification',
    obtained_date: '2023-01-15',
    expiration_date: '2026-01-15',
    certificate_number: 'HVAC-2023-001',
    is_current: true,
    days_until_expiration: 365,
    status: 'valid',
  },
  {
    id: 2,
    technician: 2,
    technician_name: 'Jane Smith',
    certification: {
      id: 2,
      name: 'Electrical Certification',
      category: 'Electrical',
      tech_level: 'Senior',
    },
    certification_name: 'Electrical Certification',
    obtained_date: '2023-05-01',
    expiration_date: '2024-12-15',
    certificate_number: 'ELE-2023-010',
    is_current: true,
    days_until_expiration: 15,
    status: 'expiring_soon',
  },
];

const handlers = [
  // Authentication endpoints
  http.post(`${API_BASE_URL}/auth/login/`, () => {
    return HttpResponse.json({
      token: 'mock-auth-token',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        groups: [{ name: 'Sales Manager' }],
      },
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout/`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Contacts endpoints
  http.get(`${API_BASE_URL}/contacts/`, () => {
    return HttpResponse.json({
      count: mockContacts.length,
      results: mockContacts,
    });
  }),

  http.get(`${API_BASE_URL}/contacts/:id/`, ({ params }) => {
    const contact = mockContacts.find(c => c.id === parseInt(params.id));
    if (!contact) {
      return HttpResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    return HttpResponse.json(contact);
  }),

  http.post(`${API_BASE_URL}/contacts/`, async ({ request }) => {
    const newContact = await request.json();
    const contact = {
      id: mockContacts.length + 1,
      ...newContact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockContacts.push(contact);
    return HttpResponse.json(contact, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/contacts/:id/`, async ({ params, request }) => {
    const updatedData = await request.json();
    const index = mockContacts.findIndex(c => c.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    mockContacts[index] = {
      ...mockContacts[index],
      ...updatedData,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockContacts[index]);
  }),

  http.delete(`${API_BASE_URL}/contacts/:id/`, ({ params }) => {
    const index = mockContacts.findIndex(c => c.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    mockContacts.splice(index, 1);
    return HttpResponse.json({}, { status: 204 });
  }),

  // Deals endpoints
  http.get(`${API_BASE_URL}/deals/`, () => {
    return HttpResponse.json({
      count: mockDeals.length,
      results: mockDeals,
    });
  }),

  http.get(`${API_BASE_URL}/deals/:id/`, ({ params }) => {
    const deal = mockDeals.find(d => d.id === parseInt(params.id));
    if (!deal) {
      return HttpResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    return HttpResponse.json(deal);
  }),

  http.post(`${API_BASE_URL}/deals/`, async ({ request }) => {
    const newDeal = await request.json();
    const deal = {
      id: mockDeals.length + 1,
      ...newDeal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDeals.push(deal);
    return HttpResponse.json(deal, { status: 201 });
  }),

  // Accounts endpoints
  http.get(`${API_BASE_URL}/accounts/`, () => {
    return HttpResponse.json({
      count: mockAccounts.length,
      results: mockAccounts,
    });
  }),

  // Projects endpoints
  http.get(`${API_BASE_URL}/projects/`, () => {
    return HttpResponse.json({
      count: mockProjects.length,
      results: mockProjects,
    });
  }),

  // Budget endpoints
  http.get(`${API_BASE_URL}/budgets/`, () => {
    return HttpResponse.json({
      count: mockBudgets.length,
      results: mockBudgets,
    });
  }),

  http.get(`${API_BASE_URL}/budgets/:id/`, ({ params }) => {
    const budget = mockBudgets.find(b => b.id === parseInt(params.id));
    if (!budget) {
      return HttpResponse.json({ error: 'Budget not found' }, { status: 404 });
    }
    return HttpResponse.json(budget);
  }),

  http.post(`${API_BASE_URL}/budgets/`, async ({ request }) => {
    const newBudget = await request.json();
    const budget = {
      id: mockBudgets.length + 1,
      ...newBudget,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockBudgets.push(budget);
    return HttpResponse.json(budget, { status: 201 });
  }),

  // Warehouse endpoints
  http.get(`${API_BASE_URL}/warehouses/`, () => {
    return HttpResponse.json({
      count: mockWarehouses.length,
      results: mockWarehouses,
    });
  }),

  http.get(`${API_BASE_URL}/warehouses/:id/`, ({ params }) => {
    const warehouse = mockWarehouses.find(w => w.id === parseInt(params.id));
    if (!warehouse) {
      return HttpResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    return HttpResponse.json(warehouse);
  }),

  http.post(`${API_BASE_URL}/warehouses/`, async ({ request }) => {
    const newWarehouse = await request.json();
    const warehouse = {
      id: mockWarehouses.length + 1,
      ...newWarehouse,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockWarehouses.push(warehouse);
    return HttpResponse.json(warehouse, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/warehouses/:id/`, async ({ params, request }) => {
    const updatedData = await request.json();
    const index = mockWarehouses.findIndex(w => w.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    mockWarehouses[index] = {
      ...mockWarehouses[index],
      ...updatedData,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockWarehouses[index]);
  }),

  http.delete(`${API_BASE_URL}/warehouses/:id/`, ({ params }) => {
    const index = mockWarehouses.findIndex(w => w.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    mockWarehouses.splice(index, 1);
    return HttpResponse.json({}, { status: 204 });
  }),

  // Warehouse Items endpoints
  http.get(`${API_BASE_URL}/warehouse-items/`, () => {
    return HttpResponse.json({
      count: mockWarehouseItems.length,
      results: mockWarehouseItems,
    });
  }),

  http.get(`${API_BASE_URL}/warehouse-items/:id/`, ({ params }) => {
    const item = mockWarehouseItems.find(i => i.id === parseInt(params.id));
    if (!item) {
      return HttpResponse.json({ error: 'Warehouse item not found' }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),

  http.post(`${API_BASE_URL}/warehouse-items/`, async ({ request }) => {
    const newItem = await request.json();
    const item = {
      id: mockWarehouseItems.length + 1,
      ...newItem,
      total_value: newItem.quantity * newItem.unit_cost,
      status: newItem.quantity > newItem.minimum_stock ? 'in_stock' : 'low_stock',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockWarehouseItems.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/warehouse-items/:id/`, async ({ params, request }) => {
    const updatedData = await request.json();
    const index = mockWarehouseItems.findIndex(i => i.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Warehouse item not found' }, { status: 404 });
    }
    mockWarehouseItems[index] = {
      ...mockWarehouseItems[index],
      ...updatedData,
      total_value: updatedData.quantity * updatedData.unit_cost,
      status: updatedData.quantity > updatedData.minimum_stock ? 'in_stock' : 'low_stock',
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(mockWarehouseItems[index]);
  }),

  http.delete(`${API_BASE_URL}/warehouse-items/:id/`, ({ params }) => {
    const index = mockWarehouseItems.findIndex(i => i.id === parseInt(params.id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Warehouse item not found' }, { status: 404 });
    }
    mockWarehouseItems.splice(index, 1);
    return HttpResponse.json({}, { status: 204 });
  }),

  // Expense endpoints
  http.get(`${API_BASE_URL}/expenses/`, () => {
    return HttpResponse.json({
      count: mockExpenses.length,
      results: mockExpenses,
    });
  }),

  http.post(`${API_BASE_URL}/expenses/`, async ({ request }) => {
    const newExpense = await request.json();
    const expense = {
      id: mockExpenses.length + 1,
      ...newExpense,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockExpenses.push(expense);
    return HttpResponse.json(expense, { status: 201 });
  }),

  // Payment endpoints
  http.get(`${API_BASE_URL}/payments/`, () => {
    return HttpResponse.json({
      count: mockPayments.length,
      results: mockPayments,
    });
  }),

  http.post(`${API_BASE_URL}/payments/`, async ({ request }) => {
    const newPayment = await request.json();
    const payment = {
      id: mockPayments.length + 1,
      ...newPayment,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockPayments.push(payment);
    return HttpResponse.json(payment, { status: 201 });
  }),

  // Certifications endpoints
  http.get(`${API_BASE_URL}/certifications/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const authority = url.searchParams.get('issuing_authority');
    let items = [...mockCertifications];
    if (search) {
      items = items.filter((c) => c.name.toLowerCase().includes(search));
    }
    if (authority) {
      items = items.filter((c) => c.issuing_authority === authority);
    }
    return HttpResponse.json({ count: items.length, results: items });
  }),

  http.get(`${API_BASE_URL}/certifications/:id/`, ({ params }) => {
    const item = mockCertifications.find((c) => c.id === parseInt(params.id));
    if (!item) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    return HttpResponse.json(item);
  }),

  http.post(`${API_BASE_URL}/certifications/`, async ({ request }) => {
    const data = await request.json();
    const item = {
      id: mockCertifications.length + 1,
      description: '',
      required_for_roles: [],
      is_active: true,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCertifications.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/certifications/:id/`, async ({ params, request }) => {
    const idx = mockCertifications.findIndex((c) => c.id === parseInt(params.id));
    if (idx === -1) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    const data = await request.json();
    mockCertifications[idx] = { ...mockCertifications[idx], ...data, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockCertifications[idx]);
  }),

  http.delete(`${API_BASE_URL}/certifications/:id/`, ({ params }) => {
    const idx = mockCertifications.findIndex((c) => c.id === parseInt(params.id));
    if (idx === -1) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    mockCertifications.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Technician Certifications endpoints
  http.get(`${API_BASE_URL}/technician-certifications/`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const technician = url.searchParams.get('technician');
    const sort = url.searchParams.get('sort');
    let items = [...mockTechnicianCertifications];
    if (status) items = items.filter((tc) => tc.status === status);
    if (technician) items = items.filter((tc) => `${tc.technician}` === `${technician}`);
    if (sort === 'expiration_date') {
      items.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
    }
    return HttpResponse.json({ count: items.length, results: items });
  }),

  http.post(`${API_BASE_URL}/technician-certifications/`, async ({ request }) => {
    const data = await request.json();
    const item = { id: mockTechnicianCertifications.length + 1, ...data };
    mockTechnicianCertifications.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/technician-certifications/:id/`, async ({ params, request }) => {
    const idx = mockTechnicianCertifications.findIndex((c) => c.id === parseInt(params.id));
    if (idx === -1) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    const data = await request.json();
    mockTechnicianCertifications[idx] = { ...mockTechnicianCertifications[idx], ...data };
    return HttpResponse.json(mockTechnicianCertifications[idx]);
  }),

  http.delete(`${API_BASE_URL}/technician-certifications/:id/`, ({ params }) => {
    const idx = mockTechnicianCertifications.findIndex((c) => c.id === parseInt(params.id));
    if (idx === -1) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
    mockTechnicianCertifications.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Dashboard analytics
  http.get(`${API_BASE_URL}/analytics/dashboard/`, () => {
    return HttpResponse.json({
      total_contacts: mockContacts.length,
      total_deals: mockDeals.length,
      total_deal_value: mockDeals.reduce((sum, deal) => sum + deal.amount, 0),
      active_projects: mockProjects.filter(p => p.status === 'active').length,
      revenue_this_month: 50000,
      deals_won_this_month: 5,
      conversion_rate: 25.5,
      total_inventory_value: mockWarehouseItems.reduce((sum, item) => sum + item.total_value, 0),
      low_stock_items: mockWarehouseItems.filter(item => item.status === 'low_stock').length,
      pending_expenses: mockExpenses.filter(exp => exp.status === 'pending').length,
    });
  }),

  // Blog Posts endpoints
  http.get(`${API_BASE_URL}/blog-posts/`, () => {
    return HttpResponse.json({
        count: 3,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            title: 'Test Blog Post 1',
            slug: 'test-blog-post-1',
            content: 'This is test content for blog post 1',
            status: 'published',
            author: { id: 1, username: 'admin' },
            tags: ['test', 'blog'],
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
            published_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            title: 'Test Blog Post 2',
            slug: 'test-blog-post-2',
            content: 'This is test content for blog post 2',
            status: 'draft',
            author: { id: 1, username: 'admin' },
            tags: ['test'],
            created_at: '2025-01-14T10:00:00Z',
            updated_at: '2025-01-14T10:00:00Z',
            published_at: null,
          },
          {
            id: 3,
            title: 'Test Blog Post 3',
            slug: 'test-blog-post-3',
            content: 'This is test content for blog post 3',
            status: 'published',
            author: { id: 2, username: 'editor' },
            tags: [],
            created_at: '2025-01-13T10:00:00Z',
            updated_at: '2025-01-13T10:00:00Z',
            published_at: '2025-01-13T10:00:00Z',
          },
        ],
      });
  }),

  http.get(`${API_BASE_URL}/blog-posts/:id/`, ({ params }) => {
    const blogPosts = [
      {
        id: 1,
        title: 'Test Blog Post 1',
        slug: 'test-blog-post-1',
        content: 'This is test content for blog post 1',
        status: 'published',
        author: { id: 1, username: 'admin' },
        tags: ['test', 'blog'],
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        published_at: '2025-01-15T10:00:00Z',
      },
      {
        id: 2,
        title: 'Test Blog Post 2',
        slug: 'test-blog-post-2',
        content: 'This is test content for blog post 2',
        status: 'draft',
        author: { id: 1, username: 'admin' },
        tags: ['test'],
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z',
        published_at: null,
      },
      {
        id: 3,
        title: 'Test Blog Post 3',
        slug: 'test-blog-post-3',
        content: 'This is test content for blog post 3',
        status: 'published',
        author: { id: 2, username: 'editor' },
        tags: [],
        created_at: '2025-01-13T10:00:00Z',
        updated_at: '2025-01-13T10:00:00Z',
        published_at: '2025-01-13T10:00:00Z',
      },
    ];

    const post = blogPosts.find(p => p.id === parseInt(params.id));
    if (!post) {
      return HttpResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.post(`${API_BASE_URL}/blog-posts/`, async ({ request }) => {
    const newPost = await request.json();
    const post = {
      id: Date.now(),
      ...newPost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(post, { status: 201 });
  }),

  // Pages endpoints
  http.get(`${API_BASE_URL}/pages/`, () => {
    return HttpResponse.json({
        count: 2,
        results: [
          {
            id: 1,
            title: 'About Us',
            slug: 'about-us',
            content: '<p>About us content</p>',
            meta_title: 'About Us | Company',
            meta_description: 'Learn about our company',
            is_published: true,
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            title: 'Contact',
            slug: 'contact',
            content: '<p>Contact us</p>',
            meta_title: 'Contact Us',
            meta_description: 'Get in touch',
            is_published: false,
            created_at: '2025-01-14T10:00:00Z',
            updated_at: '2025-01-14T10:00:00Z',
          },
        ],
      });
  }),

  // Notifications endpoints
  http.get(`${API_BASE_URL}/notifications/`, () => {
    return HttpResponse.json({
        count: 3,
        results: [
          {
            id: 1,
            type: 'info',
            title: 'New Message',
            message: 'You have a new message from John Doe',
            is_read: false,
            created_at: '2025-01-16T10:00:00Z',
          },
          {
            id: 2,
            type: 'warning',
            title: 'Deadline Approaching',
            message: 'Project deadline is in 2 days',
            is_read: false,
            created_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 3,
            type: 'success',
            title: 'Task Completed',
            message: 'Task #123 has been completed',
            is_read: true,
            created_at: '2025-01-14T10:00:00Z',
          },
        ],
      });
  }),

  http.patch(`${API_BASE_URL}/notifications/:id/`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: parseInt(params.id) }, { status: 200 });
  }),

  http.delete(`${API_BASE_URL}/notifications/:id/`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Error simulation endpoints
  http.get(`${API_BASE_URL}/test/error`, () => {
    return HttpResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/test/timeout`, () => {
    return new Promise(() => {}); // Never resolves - simulates timeout
  }),
];

// Individual handler groups for selective testing
const authHandlers = handlers.filter(handler =>
  handler.info.path.includes('/auth/')
);

const contactHandlers = handlers.filter(handler =>
  handler.info.path.includes('/contacts/')
);

const dealHandlers = handlers.filter(handler =>
  handler.info.path.includes('/deals/')
);

const errorHandlers = handlers.filter(handler =>
  handler.info.path.includes('/test/')
);

export {
  handlers,
  authHandlers,
  contactHandlers,
  dealHandlers,
  errorHandlers,
};
