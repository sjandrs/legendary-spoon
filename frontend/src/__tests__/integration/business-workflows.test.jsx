import { renderWithProviders } from '../helpers/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use global MSW setup from setupTests.js
const server = globalThis.server;
const http = globalThis.http;
const HttpResponse = globalThis.HttpResponse;

/**
 * Integration Tests for Critical Business Workflows
 *
 * These tests verify that complex, multi-component interactions work correctly
 * and prevent regressions in critical business processes.
 */

describe('Contact Management Integration', () => {
  const user = userEvent.setup();

  it('integrates contact creation with account association flow', async () => {
    // Mock the API calls for the integration flow
    server.use(
      http.get('/api/accounts/', () => {
        return HttpResponse.json([
          { id: 1, name: 'Test Account', owner: 1 },
          { id: 2, name: 'Another Account', owner: 1 }
        ]);
      }),
      http.post('/api/contacts/', () => {
        return HttpResponse.json({
          id: 1,
          first_name: 'John',
          last_name: 'Integration',
          email: 'john.integration@test.com',
          account: 1
        });
      }),
      http.get('/api/contacts/', () => {
        return HttpResponse.json([
          {
            id: 1,
            first_name: 'John',
            last_name: 'Integration',
            email: 'john.integration@test.com',
            account: 1,
            account_name: 'Test Account'
          }
        ]);
      })
    );

    // Import the components dynamically to avoid initial import issues
    const { ContactForm } = await import('../../components/ContactForm');
    const { ContactList } = await import('../../components/ContactList');

    // Test the integration flow
    renderWithProviders(<ContactForm />);

    // Fill the contact form with account association
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Integration');
    await user.type(screen.getByLabelText(/email/i), 'john.integration@test.com');

    // Select account from dropdown
    await user.selectOptions(screen.getByLabelText(/account/i), '1');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/contact saved successfully/i)).toBeInTheDocument();
    });

    // Now test that the contact appears in the list with proper account association
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Integration')).toBeInTheDocument();
      expect(screen.getByText('Test Account')).toBeInTheDocument();
    });
  });

  it('prevents contact deletion when associated with active deals', async () => {
    // Mock contact with associated deals
    server.use(
      http.get('/api/contacts/1/', () => {
        return HttpResponse.json({
          id: 1,
          first_name: 'John',
          last_name: 'HasDeals',
          email: 'john.hasdeals@test.com',
          deals_count: 2,
          active_deals: true
        });
      }),
      http.delete('/api/contacts/1/', () => {
        return HttpResponse.json({
          error: 'Cannot delete contact with active deals'
        }, { status: 400 });
      })
    );

    const { ContactDetail } = await import('../../components/ContactDetail');

    renderWithProviders(<ContactDetail contactId="1" />);

    await waitFor(() => {
      expect(screen.getByText('John HasDeals')).toBeInTheDocument();
    });

    // Attempt to delete
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/cannot delete contact with active deals/i)).toBeInTheDocument();
    });

    // Contact should still be visible
    expect(screen.getByText('John HasDeals')).toBeInTheDocument();
  });
});

describe('Deal Management Integration', () => {
  const user = userEvent.setup();

  it('integrates deal creation with automatic project generation', async () => {
    // Mock the deal-to-project workflow
    server.use(
      http.post('/api/deals/', () => {
        return HttpResponse.json({
          id: 1,
          title: 'Integration Deal',
          value: 50000,
          status: 'won',
          contact: 1
        });
      }),
      http.get('/api/projects/', () => {
        return HttpResponse.json([
          {
            id: 1,
            title: 'Auto-Generated Project: Integration Deal',
            deal: 1,
            status: 'active'
          }
        ]);
      })
    );

    const { DealForm } = await import('../../components/DealForm');
    const { TaskDashboard } = await import('../../components/TaskDashboard');

    // Create a won deal
    renderWithProviders(<DealForm />);

    await user.type(screen.getByLabelText(/title/i), 'Integration Deal');
    await user.type(screen.getByLabelText(/value/i), '50000');
    await user.selectOptions(screen.getByLabelText(/status/i), 'won');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/deal saved successfully/i)).toBeInTheDocument();
    });

    // Verify project was auto-generated
    renderWithProviders(<TaskDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Auto-Generated Project: Integration Deal')).toBeInTheDocument();
    });
  });

  it('maintains deal-contact relationships during updates', async () => {
    // Test data consistency during concurrent operations
    server.use(
      http.get('/api/deals/1/', () => {
        return HttpResponse.json({
          id: 1,
          title: 'Relationship Test Deal',
          contact: 1,
          contact_name: 'John Relationship'
        });
      }),
      http.put('/api/deals/1/', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          ...body,
          id: 1,
          contact_name: 'John Relationship'
        });
      })
    );

    const { DealDetail } = await import('../../components/DealDetail');

    renderWithProviders(<DealDetail dealId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Relationship Test Deal')).toBeInTheDocument();
      expect(screen.getByText('John Relationship')).toBeInTheDocument();
    });

    // Edit the deal
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Change title but not contact
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'Updated Deal Title');

    await user.click(screen.getByRole('button', { name: /save/i }));

    // Verify relationship is maintained
    await waitFor(() => {
      expect(screen.getByText('Updated Deal Title')).toBeInTheDocument();
      expect(screen.getByText('John Relationship')).toBeInTheDocument();
    });
  });
});

describe('Financial Integration Workflows', () => {
  const user = userEvent.setup();

  it('integrates work order completion with inventory adjustments', async () => {
    // Mock the work order inventory integration
    server.use(
      http.get('/api/work-orders/1/', () => {
        return HttpResponse.json({
          id: 1,
          title: 'Inventory Test Order',
          status: 'in_progress',
          line_items: [
            { id: 1, warehouse_item: 1, quantity_used: 5 }
          ]
        });
      }),
      http.patch('/api/work-orders/1/', () => {
        return HttpResponse.json({
          id: 1,
          title: 'Inventory Test Order',
          status: 'completed'
        });
      }),
      http.get('/api/warehouse-items/1/', () => {
        return HttpResponse.json({
          id: 1,
          name: 'Test Widget',
          quantity: 95, // Reduced from 100 after work order completion
          minimum_stock: 20
        });
      })
    );

    const { WorkOrderDetail } = await import('../../components/WorkOrderDetail');
    const { Warehouse } = await import('../../components/Warehouse');

    // Complete a work order
    renderWithProviders(<WorkOrderDetail workOrderId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Inventory Test Order')).toBeInTheDocument();
    });

    // Mark as completed
    await user.click(screen.getByRole('button', { name: /mark completed/i }));

    await waitFor(() => {
      expect(screen.getByText(/work order completed/i)).toBeInTheDocument();
    });

    // Verify inventory was adjusted
    renderWithProviders(<Warehouse />);

    await waitFor(() => {
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument(); // Updated quantity
    });
  });

  it('prevents double-billing during invoice generation', async () => {
    // Test regression scenario that previously caused duplicate invoices
    let invoiceCreationCount = 0;

    server.use(
      http.get('/api/work-orders/1/', () => {
        return HttpResponse.json({
          id: 1,
          title: 'Billing Test Order',
          status: 'completed',
          has_invoice: invoiceCreationCount > 0
        });
      }),
      http.post('/api/work-orders/1/generate-invoice/', () => {
        invoiceCreationCount++;
        if (invoiceCreationCount > 1) {
          return new Response(
            JSON.stringify({ error: 'Invoice already exists for this work order' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return HttpResponse.json({
          id: 1,
          work_order: 1,
          total: 5000
        });
      })
    );

    const { WorkOrderDetail } = await import('../../components/WorkOrderDetail');

    renderWithProviders(<WorkOrderDetail workOrderId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Billing Test Order')).toBeInTheDocument();
    });

    // Generate invoice
    await user.click(screen.getByRole('button', { name: /generate invoice/i }));

    await waitFor(() => {
      expect(screen.getByText(/invoice generated/i)).toBeInTheDocument();
    });

    // Attempt to generate again (should fail)
    await user.click(screen.getByRole('button', { name: /generate invoice/i }));

    await waitFor(() => {
      expect(screen.getByText(/invoice already exists/i)).toBeInTheDocument();
    });
  });
});

describe('User Authentication Integration', () => {
  const user = userEvent.setup();

  it('maintains role-based access control across navigation', async () => {
    // Mock different user roles
    server.use(
      http.post('/api/auth/login/', () => {
        return HttpResponse.json({
          token: 'test-token',
          user: {
            id: 1,
            username: 'salesrep',
            groups: ['Sales Rep']
          }
        });
      }),
      http.get('/api/accounts/', () => {
        // Sales Rep should only see their accounts
        return HttpResponse.json([
          { id: 1, name: 'My Account', owner: 1 }
        ]);
      }),
      http.get('/api/staff/', () => {
        // Sales Rep should not have access to staff management
        return new Response(
          JSON.stringify({ error: 'Permission denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    const { Login } = await import('../../components/Login');
    const { AccountList } = await import('../../components/AccountList');
    const { Staff } = await import('../../components/Staff');

    // Login as sales rep
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'salesrep');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Should have access to accounts (filtered to their data)
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(screen.getByText('My Account')).toBeInTheDocument();
    });

    // Should NOT have access to staff management
    renderWithProviders(<Staff />);

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
  });
});

describe('Data Consistency Integration', () => {
  const user = userEvent.setup();

  it('maintains referential integrity during cascade operations', async () => {
    // Test complex data relationships
    server.use(
      http.delete('/api/contacts/1/', () => {
        return HttpResponse.json({ success: true });
      }),
      http.get('/api/deals/', () => {
        return HttpResponse.json([
          {
            id: 1,
            title: 'Orphaned Deal',
            contact: null, // Contact was deleted
            contact_name: 'Deleted Contact'
          }
        ]);
      })
    );

    const { ContactList } = await import('../../components/ContactList');
    const { DealList } = await import('../../components/DealList');

    // Delete a contact
    renderWithProviders(<ContactList />);

    // Mock contact deletion
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Check deals list handles orphaned references gracefully
    renderWithProviders(<DealList />);

    await waitFor(() => {
      expect(screen.getByText('Orphaned Deal')).toBeInTheDocument();
      expect(screen.getByText('Deleted Contact')).toBeInTheDocument();
    });
  });
});
