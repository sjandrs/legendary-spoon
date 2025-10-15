/**
 * Field Service Paperwork Management E2E Tests - Phase 4 Enhancement
 * Tests paperwork template management and document generation workflows
 */

describe('Field Service Paperwork Management', () => {
  beforeEach(() => {
    // Login and navigate to paperwork templates
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Navigate to paperwork templates
    cy.get('[data-testid="nav-field-service"]').trigger('mouseenter');
    cy.contains('Paperwork Templates').click();
    cy.url().should('include', '/paperwork-templates');
  });

  describe('Template Management Interface', () => {
    it('should display templates list with proper columns', () => {
      // Verify main interface elements
      cy.get('[data-testid="templates-list"]').should('be.visible');
      cy.get('[data-testid="new-template-btn"]').should('be.visible');

      // Check table headers
      cy.get('th').should('contain', 'Name');
      cy.get('th').should('contain', 'Category');
      cy.get('th').should('contain', 'Active');
      cy.get('th').should('contain', 'Actions');
    });

    it('should create new paperwork template', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Fill template form
      cy.get('input[name="name"]').type('HVAC Service Completion Form');
      cy.get('textarea[name="description"]').type('Standard form for HVAC service completion');
      cy.get('select[name="category"]').select('Service Completion');

      // Add template content with variables
      const templateContent = `
        <h2>Service Completion Report</h2>
        <p><strong>Customer:</strong> {{customer_name}}</p>
        <p><strong>Date:</strong> {{service_date}}</p>
        <p><strong>Technician:</strong> {{technician_name}}</p>

        <h3>Work Performed</h3>
        <p>{{work_description}}</p>

        <h3>Parts Used</h3>
        {{#if parts_used}}
          <ul>
            {{#each parts_used}}
              <li>{{name}} - Qty: {{quantity}} - ${{cost}}</li>
            {{/each}}
          </ul>
        {{else}}
          <p>No parts used</p>
        {{/if}}

        <h3>Recommendations</h3>
        <p>{{recommendations}}</p>

        {{#if requires_signature}}
          <div class="signature-section">
            <p>Customer Signature: ________________________</p>
            <p>Date: _______________</p>
          </div>
        {{/if}}
      `;

      cy.get('textarea[name="content"]').clear().type(templateContent);

      // Set conditional logic
      cy.get('textarea[name="conditional_logic"]').type('requires_signature = work_type === "installation"');

      // Enable signature requirement
      cy.get('input[name="requires_signature"]').check();

      // Save template
      cy.get('button[type="submit"]').click();

      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Template created successfully');
      cy.get('[data-testid="templates-list"]').should('contain', 'HVAC Service Completion Form');
    });

    it('should edit existing template', () => {
      // Click edit on first template
      cy.get('[data-testid="edit-template-btn"]').first().click();

      // Modify template
      cy.get('input[name="name"]').clear().type('Updated Template Name');
      cy.get('textarea[name="description"]').clear().type('Updated description');

      // Save changes
      cy.get('button[type="submit"]').click();

      // Verify update
      cy.get('[data-testid="success-message"]').should('contain', 'Template updated successfully');
      cy.get('[data-testid="templates-list"]').should('contain', 'Updated Template Name');
    });

    it('should preview template with sample data', () => {
      cy.get('[data-testid="preview-template-btn"]').first().click();

      // Fill preview data
      cy.get('input[name="customer_name"]').type('John Smith');
      cy.get('input[name="service_date"]').type('2025-10-15');
      cy.get('input[name="technician_name"]').type('Mike Johnson');
      cy.get('textarea[name="work_description"]').type('Replaced heating element');

      // Generate preview
      cy.get('[data-testid="generate-preview-btn"]').click();

      // Verify preview content
      cy.get('[data-testid="template-preview"]').should('be.visible');
      cy.get('[data-testid="template-preview"]').should('contain', 'John Smith');
      cy.get('[data-testid="template-preview"]').should('contain', 'Mike Johnson');
      cy.get('[data-testid="template-preview"]').should('contain', 'Replaced heating element');
    });
  });

  describe('Template Categories and Organization', () => {
    it('should filter templates by category', () => {
      // Use category filter
      cy.get('[data-testid="category-filter"]').select('Service Completion');

      // Verify filtered results
      cy.get('[data-testid="templates-list"] tr').should('have.length.greaterThan', 0);
      cy.get('[data-testid="templates-list"]').should('contain', 'Service Completion');

      // Clear filter
      cy.get('[data-testid="category-filter"]').select('All Categories');
    });

    it('should search templates by name', () => {
      cy.get('[data-testid="template-search"]').type('HVAC');

      // Verify search results
      cy.get('[data-testid="templates-list"] tr').should('contain', 'HVAC');

      // Clear search
      cy.get('[data-testid="template-search"]').clear();
    });

    it('should manage template status (active/inactive)', () => {
      // Toggle template status
      cy.get('[data-testid="status-toggle"]').first().click();

      // Verify status change
      cy.get('[data-testid="success-message"]').should('contain', 'Template status updated');
    });
  });

  describe('Variable System and Conditional Logic', () => {
    it('should insert variables into template content', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Open variable insertion panel
      cy.get('[data-testid="insert-variable-btn"]').click();

      // Insert customer variable
      cy.get('[data-testid="variable-customer-name"]').click();

      // Verify variable inserted
      cy.get('textarea[name="content"]').should('contain', '{{customer_name}}');

      // Insert work order variable
      cy.get('[data-testid="variable-work-order"]').click();
      cy.get('textarea[name="content"]').should('contain', '{{work_order.id}}');
    });

    it('should validate conditional logic syntax', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Add invalid conditional logic
      cy.get('textarea[name="conditional_logic"]').type('invalid syntax here');

      // Attempt to save
      cy.get('button[type="submit"]').click();

      // Verify validation error
      cy.get('[data-testid="validation-error"]').should('contain', 'Invalid conditional logic syntax');
    });

    it('should test conditional logic with sample data', () => {
      cy.get('[data-testid="edit-template-btn"]').first().click();

      // Add conditional logic
      cy.get('textarea[name="conditional_logic"]').clear().type('show_warranty = work_type === "installation"');

      // Test with sample data
      cy.get('[data-testid="test-logic-btn"]').click();
      cy.get('select[name="work_type"]').select('installation');
      cy.get('[data-testid="execute-test"]').click();

      // Verify conditional result
      cy.get('[data-testid="logic-result"]').should('contain', 'show_warranty: true');
    });
  });

  describe('Document Generation Workflow', () => {
    it('should generate document from template', () => {
      // Navigate to work orders to use template
      cy.visit('/orders');
      cy.get('[data-testid="work-order-row"]').first().click();

      // Generate document from template
      cy.get('[data-testid="generate-document-btn"]').click();
      cy.get('select[name="template"]').select('HVAC Service Completion Form');

      // Fill document data
      cy.get('textarea[name="work_performed"]').type('Replaced thermostat and checked refrigerant levels');
      cy.get('textarea[name="recommendations"]').type('Schedule annual maintenance');

      // Generate document
      cy.get('[data-testid="generate-btn"]').click();

      // Verify document generation
      cy.get('[data-testid="success-message"]').should('contain', 'Document generated successfully');
      cy.get('[data-testid="download-document-btn"]').should('be.visible');
    });

    it('should handle template with signature requirement', () => {
      cy.visit('/orders');
      cy.get('[data-testid="work-order-row"]').first().click();

      // Select template requiring signature
      cy.get('[data-testid="generate-document-btn"]').click();
      cy.get('select[name="template"]').select('Installation Completion Form');

      // Verify signature section appears
      cy.get('[data-testid="signature-required"]').should('be.visible');
      cy.get('[data-testid="digital-signature-btn"]').should('be.visible');

      // Capture signature
      cy.get('[data-testid="digital-signature-btn"]').click();
      // Note: Actual signature capture would be tested in DigitalSignaturePad tests

      cy.get('[data-testid="signature-captured"]').should('be.visible');
    });

    it('should export document as PDF', () => {
      cy.visit('/orders');
      cy.get('[data-testid="work-order-row"]').first().click();
      cy.get('[data-testid="generate-document-btn"]').click();

      // Generate document
      cy.get('select[name="template"]').select('Service Report Template');
      cy.get('[data-testid="generate-btn"]').click();

      // Export as PDF
      cy.get('[data-testid="export-pdf-btn"]').click();

      // Verify PDF generation (check for download trigger)
      cy.get('[data-testid="success-message"]').should('contain', 'PDF generated');
    });
  });

  describe('Template Versioning and History', () => {
    it('should maintain template version history', () => {
      cy.get('[data-testid="edit-template-btn"]').first().click();

      // Make changes to create new version
      cy.get('textarea[name="content"]').clear().type('Updated template content v2');
      cy.get('input[name="version_notes"]').type('Added new sections and improved formatting');

      // Save as new version
      cy.get('button[type="submit"]').click();

      // View version history
      cy.get('[data-testid="version-history-btn"]').click();

      // Verify version tracking
      cy.get('[data-testid="version-list"]').should('contain', 'v2');
      cy.get('[data-testid="version-notes"]').should('contain', 'Added new sections');
    });

    it('should revert to previous template version', () => {
      cy.get('[data-testid="edit-template-btn"]').first().click();
      cy.get('[data-testid="version-history-btn"]').click();

      // Revert to previous version
      cy.get('[data-testid="revert-btn"]').first().click();
      cy.get('[data-testid="confirm-revert"]').click();

      // Verify reversion
      cy.get('[data-testid="success-message"]').should('contain', 'Reverted to previous version');
    });
  });

  describe('Accessibility and Usability', () => {
    it('should meet accessibility standards', () => {
      cy.injectAxe();
      cy.checkA11y('[data-testid="paperwork-container"]');

      // Test form accessibility
      cy.get('[data-testid="new-template-btn"]').click();
      cy.checkA11y('[data-testid="template-form"]');
    });

    it('should support keyboard navigation', () => {
      // Tab through interface elements
      cy.get('[data-testid="new-template-btn"]').focus();
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-testid', 'template-search');

      // Navigate table with arrow keys
      cy.get('[data-testid="templates-list"] tbody tr').first().focus();
      cy.focused().type('{downarrow}');
      cy.focused().should('be', '[data-testid="templates-list"] tbody tr:nth-child(2)');
    });

    it('should provide clear error messages', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Submit empty form
      cy.get('button[type="submit"]').click();

      // Verify clear validation messages
      cy.get('[data-testid="name-error"]').should('contain', 'Template name is required');
      cy.get('[data-testid="content-error"]').should('contain', 'Template content cannot be empty');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle large template content efficiently', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Create large template content
      const largeContent = 'Large content section. '.repeat(1000);
      cy.get('textarea[name="content"]').type(largeContent);

      // Verify interface remains responsive
      cy.get('input[name="name"]').type('Large Template Test');
      cy.get('button[type="submit"]').should('be.enabled');
    });

    it('should handle API errors gracefully', () => {
      // Intercept API to simulate error
      cy.intercept('POST', '/api/paperwork-templates/', { statusCode: 500 }).as('createTemplateError');

      cy.get('[data-testid="new-template-btn"]').click();
      cy.get('input[name="name"]').type('Test Template');
      cy.get('textarea[name="content"]').type('Test content');
      cy.get('button[type="submit"]').click();

      cy.wait('@createTemplateError');

      // Verify error handling
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to create template');
    });

    it('should validate template before saving', () => {
      cy.get('[data-testid="new-template-btn"]').click();

      // Add invalid template syntax
      cy.get('textarea[name="content"]').type('{{invalid_variable');
      cy.get('input[name="name"]').type('Invalid Template');

      // Attempt to save
      cy.get('button[type="submit"]').click();

      // Verify validation error
      cy.get('[data-testid="validation-error"]').should('contain', 'Invalid template syntax');
    });
  });
});
