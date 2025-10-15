/**
 * Cypress E2E Tests: Technician Management Module
 *
 * Comprehensive end-to-end testing for technician lifecycle management,
 * certification tracking, availability scheduling, and organizational management.
 *
 * Test Coverage:
 * - Technician CRUD operations
 * - Certification management workflows
 * - Availability calendar interactions
 * - Coverage area management
 * - Organizational chart navigation
 * - Role-based access control
 * - Work order assignment workflows
 */

describe('Technician Management Module', () => {
  beforeEach(() => {
    // Login as admin user with full access
    cy.login('admin', 'password')
    cy.visit('/staff/technicians')
  })

  describe('Technician List and Search', () => {
    it('should display technician list with proper loading and data', () => {
      // Verify page loads
      cy.get('[data-testid="technician-list"]').should('be.visible')

      // Verify search functionality
      cy.get('[data-testid="technician-search"]').type('John')
      cy.get('[data-testid="technician-card"]').should('contain', 'John')

      // Verify status filtering
      cy.get('[data-testid="status-filter"]').select('active')
      cy.get('[data-testid="technician-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Active')
      })
    })

    it('should support pagination and virtualization', () => {
      cy.get('[data-testid="technician-list"]').should('be.visible')

      // Test scrolling for virtualization
      cy.get('[data-testid="technician-list"]').scrollTo(0, 500)
      cy.get('[data-testid="technician-card"]').should('have.length.greaterThan', 10)

      // Verify load more functionality if implemented
      cy.get('[data-testid="load-more-button"]').then(($button) => {
        if ($button.length) {
          cy.wrap($button).click()
          cy.get('[data-testid="technician-card"]').should('have.length.greaterThan', 20)
        }
      })
    })

    it('should handle empty states and error scenarios', () => {
      // Test empty search results
      cy.get('[data-testid="technician-search"]').type('NonexistentTechnician123')
      cy.get('[data-testid="no-results"]').should('contain', 'No technicians found')

      // Clear search and verify results return
      cy.get('[data-testid="technician-search"]').clear()
      cy.get('[data-testid="technician-card"]').should('have.length.greaterThan', 0)
    })
  })

  describe('Technician Profile Management', () => {
    it('should create new technician with complete profile', () => {
      cy.get('[data-testid="add-technician-button"]').click()

      // Fill basic information
      cy.get('#firstName').type('Jane')
      cy.get('#lastName').type('Smith')
      cy.get('#email').type('jane.smith@company.com')
      cy.get('#phone').type('555-123-4567')
      cy.get('#employeeId').type('EMP001')

      // Set employment details
      cy.get('#hireDate').type('2024-01-15')
      cy.get('#jobTitle').type('Senior Technician')
      cy.get('#department').type('Field Service')
      cy.get('#hourlyRate').type('35.50')

      // Configure status and availability
      cy.get('#status').select('active')
      cy.get('#workingHours').type('8:00 AM - 5:00 PM')

      // Add emergency contact
      cy.get('#emergencyContactName').type('John Smith')
      cy.get('#emergencyContactPhone').type('555-987-6543')

      // Submit form
      cy.get('[data-testid="save-technician"]').click()

      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Technician created successfully')
      cy.url().should('include', '/staff/technicians/')
      cy.get('[data-testid="technician-name"]').should('contain', 'Jane Smith')
    })

    it('should view technician detail with comprehensive information', () => {
      // Click on first technician
      cy.get('[data-testid="technician-card"]').first().click()

      // Verify profile information sections
      cy.get('[data-testid="profile-section"]').should('be.visible')
      cy.get('[data-testid="contact-section"]').should('be.visible')
      cy.get('[data-testid="employment-section"]').should('be.visible')
      cy.get('[data-testid="certifications-section"]').should('be.visible')
      cy.get('[data-testid="coverage-areas-section"]').should('be.visible')

      // Verify action buttons
      cy.get('[data-testid="edit-technician"]').should('be.visible')
      cy.get('[data-testid="view-schedule"]').should('be.visible')
      cy.get('[data-testid="assign-work-order"]').should('be.visible')
    })

    it('should edit existing technician profile', () => {
      // Navigate to first technician and edit
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="edit-technician"]').click()

      // Update job title and rate
      cy.get('#jobTitle').clear().type('Lead Technician')
      cy.get('#hourlyRate').clear().type('42.00')

      // Update phone number
      cy.get('#phone').clear().type('555-111-2222')

      // Save changes
      cy.get('[data-testid="save-technician"]').click()

      // Verify updates
      cy.get('[data-testid="success-message"]').should('contain', 'Technician updated successfully')
      cy.get('[data-testid="job-title"]').should('contain', 'Lead Technician')
      cy.get('[data-testid="hourly-rate"]').should('contain', '$42.00')
    })

    it('should handle profile photo upload', () => {
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="edit-technician"]').click()

      // Mock file upload
      cy.fixture('technician-photo.jpg').then(fileContent => {
        cy.get('#profilePhoto').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg'
        })
      })

      // Verify preview
      cy.get('[data-testid="photo-preview"]').should('be.visible')

      // Save and verify
      cy.get('[data-testid="save-technician"]').click()
      cy.get('[data-testid="profile-photo"]').should('be.visible')
    })
  })

  describe('Certification Management', () => {
    it('should display certification dashboard with metrics', () => {
      cy.visit('/staff/certifications')

      // Verify dashboard elements
      cy.get('[data-testid="certification-dashboard"]').should('be.visible')
      cy.get('[data-testid="total-certifications"]').should('be.visible')
      cy.get('[data-testid="expiring-soon"]').should('be.visible')
      cy.get('[data-testid="compliance-rate"]').should('be.visible')

      // Verify certification list
      cy.get('[data-testid="certification-list"]').should('be.visible')
      cy.get('[data-testid="certification-card"]').should('have.length.greaterThan', 0)
    })

    it('should create new certification type', () => {
      cy.visit('/staff/certifications')
      cy.get('[data-testid="add-certification"]').click()

      // Fill certification details
      cy.get('#certificationName').type('HVAC Advanced Repair')
      cy.get('#issuingAuthority').type('HVAC Certification Board')
      cy.get('#validityPeriod').type('24')
      cy.get('#description').type('Advanced HVAC system repair and maintenance certification')

      // Set requirements
      cy.get('#isRequired').check()
      cy.get('#skillLevel').select('advanced')

      // Save certification
      cy.get('[data-testid="save-certification"]').click()

      // Verify creation
      cy.get('[data-testid="success-message"]').should('contain', 'Certification created successfully')
      cy.get('[data-testid="certification-card"]').should('contain', 'HVAC Advanced Repair')
    })

    it('should assign certification to technician', () => {
      // Navigate to technician profile
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()

      // Add certification
      cy.get('[data-testid="add-certification-button"]').click()
      cy.get('#certificationType').select('HVAC Basic')
      cy.get('#obtainedDate').type('2024-01-15')
      cy.get('#expirationDate').type('2026-01-15')
      cy.get('#certificationNumber').type('HVAC-2024-001')

      // Upload certificate
      cy.fixture('certificate.pdf').then(fileContent => {
        cy.get('#certificateFile').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'certificate.pdf',
          mimeType: 'application/pdf'
        })
      })

      // Save assignment
      cy.get('[data-testid="save-certification-assignment"]').click()

      // Verify assignment
      cy.get('[data-testid="technician-certifications"]').should('contain', 'HVAC Basic')
      cy.get('[data-testid="certification-status"]').should('contain', 'Valid')
    })

    it('should track expiration and renewal alerts', () => {
      cy.visit('/staff/certifications')

      // Check expiring certifications section
      cy.get('[data-testid="expiring-soon"]').click()
      cy.get('[data-testid="expiring-certification"]').should('have.length.greaterThan', 0)

      // Verify renewal workflow
      cy.get('[data-testid="renew-certification"]').first().click()
      cy.get('#newExpirationDate').type('2025-12-31')
      cy.get('#renewalNotes').type('Renewed after refresher course completion')

      // Save renewal
      cy.get('[data-testid="save-renewal"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'Certification renewed successfully')
    })
  })

  describe('Availability Calendar Management', () => {
    it('should display interactive availability calendar', () => {
      // Navigate to technician and view schedule
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="view-schedule"]').click()

      // Verify calendar components
      cy.get('[data-testid="availability-calendar"]').should('be.visible')
      cy.get('.fc-toolbar').should('be.visible')
      cy.get('.fc-daygrid-day').should('have.length.greaterThan', 28)

      // Test view switching
      cy.get('.fc-dayGridWeek-button').click()
      cy.get('.fc-col-header-day').should('have.length', 7)

      cy.get('.fc-timeGridDay-button').click()
      cy.get('.fc-timegrid-slots').should('be.visible')
    })

    it('should create availability entries', () => {
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="view-schedule"]').click()

      // Click on a day to create availability
      cy.get('.fc-daygrid-day').first().click()

      // Fill availability form
      cy.get('#startTime').type('08:00')
      cy.get('#endTime').type('17:00')
      cy.get('#availabilityType').select('regular')
      cy.get('#notes').type('Standard business hours availability')

      // Set recurring pattern
      cy.get('#isRecurring').check()
      cy.get('#recurringPattern').select('weekly')
      cy.get('#recurringUntil').type('2024-12-31')

      // Save availability
      cy.get('[data-testid="save-availability"]').click()

      // Verify calendar update
      cy.get('.fc-event').should('contain', '8:00 AM - 5:00 PM')
    })

    it('should handle drag and drop scheduling', () => {
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="view-schedule"]').click()

      // Switch to week view for better drag testing
      cy.get('.fc-dayGridWeek-button').click()

      // Drag to create new availability block
      cy.get('.fc-daygrid-day').first()
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 100 })
        .trigger('mouseup')

      // Verify creation dialog appears
      cy.get('[data-testid="availability-form"]').should('be.visible')

      // Cancel and test existing event drag
      cy.get('[data-testid="cancel-availability"]').click()

      // Drag existing event to new time
      cy.get('.fc-event').first()
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 400, clientY: 200 })
        .trigger('mouseup')

      // Verify update confirmation
      cy.get('[data-testid="confirm-move"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'Availability updated')
    })

    it('should manage time-off requests', () => {
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="view-schedule"]').click()

      // Add time-off request
      cy.get('[data-testid="request-time-off"]').click()

      // Fill time-off form
      cy.get('#startDate').type('2024-12-23')
      cy.get('#endDate').type('2024-12-27')
      cy.get('#timeOffType').select('vacation')
      cy.get('#reason').type('Holiday vacation')

      // Submit request
      cy.get('[data-testid="submit-time-off"]').click()

      // Verify pending status
      cy.get('[data-testid="time-off-status"]').should('contain', 'Pending Approval')
      cy.get('.fc-event').should('contain', 'Time Off (Pending)')
    })
  })

  describe('Coverage Area Management', () => {
    it('should display interactive coverage map', () => {
      cy.visit('/staff/coverage-areas')

      // Verify map components
      cy.get('[data-testid="coverage-map"]').should('be.visible')
      cy.get('.leaflet-container').should('be.visible')
      cy.get('[data-testid="area-list"]').should('be.visible')

      // Verify map controls
      cy.get('.leaflet-control-zoom').should('be.visible')
      cy.get('[data-testid="map-controls"]').should('be.visible')
    })

    it('should create new coverage area', () => {
      cy.visit('/staff/coverage-areas')

      // Start drawing new area
      cy.get('[data-testid="add-coverage-area"]').click()
      cy.get('[data-testid="draw-polygon"]').click()

      // Simulate polygon drawing (simplified)
      cy.get('.leaflet-container')
        .click(200, 200)
        .click(300, 200)
        .click(300, 300)
        .click(200, 300)
        .click(200, 200) // Close polygon

      // Fill area details
      cy.get('#areaName').type('Downtown Service Area')
      cy.get('#description').type('Primary downtown coverage zone')
      cy.get('#priority').select('high')

      // Assign technicians
      cy.get('#assignedTechnicians').select(['tech-1', 'tech-2'])

      // Save area
      cy.get('[data-testid="save-coverage-area"]').click()

      // Verify creation
      cy.get('[data-testid="success-message"]').should('contain', 'Coverage area created')
      cy.get('[data-testid="area-list"]').should('contain', 'Downtown Service Area')
    })

    it('should assign technicians to coverage areas', () => {
      cy.visit('/staff/coverage-areas')

      // Select existing coverage area
      cy.get('[data-testid="coverage-area-card"]').first().click()

      // Edit assignments
      cy.get('[data-testid="edit-assignments"]').click()

      // Add new technician
      cy.get('#availableTechnicians').select('John Doe')
      cy.get('[data-testid="assign-technician"]').click()

      // Set technician priority in area
      cy.get('[data-testid="technician-priority"]').select('primary')

      // Save assignments
      cy.get('[data-testid="save-assignments"]').click()

      // Verify assignment
      cy.get('[data-testid="assigned-technicians"]').should('contain', 'John Doe')
      cy.get('[data-testid="primary-technician"]').should('contain', 'John Doe')
    })

    it('should handle geocoding and location search', () => {
      cy.visit('/staff/coverage-areas')

      // Test address search
      cy.get('[data-testid="location-search"]').type('123 Main Street, Anytown, ST 12345')
      cy.get('[data-testid="search-address"]').click()

      // Verify map centers on location
      cy.wait(1000) // Wait for geocoding
      cy.get('[data-testid="search-marker"]').should('be.visible')

      // Test reverse geocoding
      cy.get('.leaflet-container').rightclick(250, 250)
      cy.get('[data-testid="get-address"]').click()

      // Verify address appears
      cy.get('[data-testid="reverse-geocoded-address"]').should('be.visible')
    })
  })

  describe('Organizational Chart Navigation', () => {
    it('should display interactive org chart', () => {
      cy.visit('/staff/organization')

      // Verify org chart elements
      cy.get('[data-testid="org-chart"]').should('be.visible')
      cy.get('[data-testid="org-node"]').should('have.length.greaterThan', 0)
      cy.get('[data-testid="org-connection"]').should('be.visible')

      // Test zoom controls
      cy.get('[data-testid="zoom-in"]').click()
      cy.get('[data-testid="zoom-out"]').click()
      cy.get('[data-testid="fit-to-screen"]').click()
    })

    it('should navigate hierarchy and show details', () => {
      cy.visit('/staff/organization')

      // Click on manager node
      cy.get('[data-testid="manager-node"]').first().click()

      // Verify detail panel
      cy.get('[data-testid="node-details"]').should('be.visible')
      cy.get('[data-testid="employee-name"]').should('be.visible')
      cy.get('[data-testid="job-title"]').should('be.visible')
      cy.get('[data-testid="direct-reports"]').should('be.visible')

      // Test expand/collapse
      cy.get('[data-testid="expand-node"]').click()
      cy.get('[data-testid="subordinate-node"]').should('have.length.greaterThan', 0)

      cy.get('[data-testid="collapse-node"]').click()
      cy.get('[data-testid="subordinate-node"]').should('not.exist')
    })

    it('should filter and search org chart', () => {
      cy.visit('/staff/organization')

      // Test department filter
      cy.get('[data-testid="department-filter"]').select('Field Service')
      cy.get('[data-testid="org-node"]').each(($node) => {
        cy.wrap($node).should('contain', 'Field Service')
      })

      // Test search functionality
      cy.get('[data-testid="org-search"]').type('Manager')
      cy.get('[data-testid="org-node"]').should('contain', 'Manager')

      // Clear filters
      cy.get('[data-testid="clear-filters"]').click()
      cy.get('[data-testid="org-node"]').should('have.length.greaterThan', 5)
    })
  })

  describe('Work Order Assignment Workflows', () => {
    it('should find qualified technicians for work order', () => {
      cy.visit('/orders')
      cy.get('[data-testid="work-order-card"]').first().click()

      // Start assignment process
      cy.get('[data-testid="assign-technician"]').click()

      // Verify qualification matching
      cy.get('[data-testid="qualified-technicians"]').should('be.visible')
      cy.get('[data-testid="technician-match"]').should('have.length.greaterThan', 0)

      // Check qualification details
      cy.get('[data-testid="qualification-score"]').should('be.visible')
      cy.get('[data-testid="missing-certifications"]').should('be.visible')
      cy.get('[data-testid="availability-status"]').should('be.visible')
    })

    it('should complete technician assignment with scheduling', () => {
      cy.visit('/orders')
      cy.get('[data-testid="work-order-card"]').first().click()
      cy.get('[data-testid="assign-technician"]').click()

      // Select qualified technician
      cy.get('[data-testid="technician-match"]').first().click()

      // Schedule appointment
      cy.get('#scheduledDate').type('2024-12-15')
      cy.get('#scheduledTime').type('10:00')
      cy.get('#estimatedDuration').type('4')

      // Add assignment notes
      cy.get('#assignmentNotes').type('Customer prefers morning appointments')

      // Confirm assignment
      cy.get('[data-testid="confirm-assignment"]').click()

      // Verify assignment
      cy.get('[data-testid="success-message"]').should('contain', 'Technician assigned successfully')
      cy.get('[data-testid="assigned-technician"]').should('be.visible')
      cy.get('[data-testid="scheduled-time"]').should('contain', '10:00 AM')
    })

    it('should handle assignment conflicts and alternatives', () => {
      cy.visit('/orders')
      cy.get('[data-testid="work-order-card"]').first().click()
      cy.get('[data-testid="assign-technician"]').click()

      // Try to assign unavailable technician
      cy.get('[data-testid="unavailable-technician"]').click()

      // Verify conflict warning
      cy.get('[data-testid="conflict-warning"]').should('contain', 'scheduling conflict')

      // View alternative suggestions
      cy.get('[data-testid="view-alternatives"]').click()
      cy.get('[data-testid="alternative-technician"]').should('have.length.greaterThan', 0)

      // Select alternative
      cy.get('[data-testid="alternative-technician"]').first().click()
      cy.get('[data-testid="confirm-assignment"]').click()

      // Verify successful assignment
      cy.get('[data-testid="success-message"]').should('contain', 'Alternative technician assigned')
    })
  })

  describe('Role-Based Access Control', () => {
    it('should enforce manager-level permissions', () => {
      // Login as manager
      cy.login('manager', 'password')
      cy.visit('/staff/technicians')

      // Verify full access
      cy.get('[data-testid="add-technician-button"]').should('be.visible')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="edit-technician"]').should('be.visible')
      cy.get('[data-testid="delete-technician"]').should('be.visible')

      // Test bulk operations
      cy.visit('/staff/technicians')
      cy.get('[data-testid="select-all-technicians"]').click()
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
    })

    it('should restrict supervisor-level permissions', () => {
      // Login as supervisor
      cy.login('supervisor', 'password')
      cy.visit('/staff/technicians')

      // Verify limited access
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="edit-technician"]').should('be.visible')
      cy.get('[data-testid="delete-technician"]').should('not.exist')

      // Cannot create new technicians
      cy.get('[data-testid="add-technician-button"]').should('not.exist')

      // Can manage schedules and assignments
      cy.get('[data-testid="view-schedule"]').should('be.visible')
      cy.get('[data-testid="assign-work-order"]').should('be.visible')
    })

    it('should limit technician self-service access', () => {
      // Login as regular technician
      cy.login('technician', 'password')
      cy.visit('/staff/my-profile')

      // Can view own profile
      cy.get('[data-testid="technician-profile"]').should('be.visible')

      // Can update limited fields
      cy.get('[data-testid="edit-profile"]').click()
      cy.get('#phone').should('not.be.disabled')
      cy.get('#emergencyContact').should('not.be.disabled')

      // Cannot edit employment details
      cy.get('#hourlyRate').should('be.disabled')
      cy.get('#status').should('be.disabled')

      // Cannot access other technicians
      cy.visit('/staff/technicians', { failOnStatusCode: false })
      cy.get('[data-testid="access-denied"]').should('be.visible')
    })
  })

  describe('Mobile Responsiveness and Accessibility', () => {
    it('should work properly on mobile viewport', () => {
      cy.viewport('iphone-6')
      cy.visit('/staff/technicians')

      // Verify mobile layout
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible')
      cy.get('[data-testid="technician-list"]').should('be.visible')

      // Test mobile interactions
      cy.get('[data-testid="technician-card"]').first().should('be.visible')
      cy.get('[data-testid="technician-card"]').first().click()

      // Verify mobile detail view
      cy.get('[data-testid="mobile-back-button"]').should('be.visible')
      cy.get('[data-testid="technician-profile"]').should('be.visible')
    })

    it('should meet accessibility standards', () => {
      cy.visit('/staff/technicians')
      cy.injectAxe()

      // Check for accessibility violations
      cy.checkA11y()

      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'technician-search')

      cy.tab()
      cy.focused().should('have.attr', 'data-testid', 'status-filter')

      // Test screen reader compatibility
      cy.get('[data-testid="technician-card"]').first()
        .should('have.attr', 'role', 'button')
        .should('have.attr', 'aria-label')
    })
  })

  describe('Data Integration and Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/technicians/', { fixture: 'large-technician-dataset.json' })

      cy.visit('/staff/technicians')

      // Verify virtualization works with large dataset
      cy.get('[data-testid="technician-list"]').should('be.visible')
      cy.get('[data-testid="technician-card"]').should('have.length.lessThan', 50) // Only visible items

      // Test smooth scrolling
      cy.get('[data-testid="technician-list"]').scrollTo(0, 2000)
      cy.get('[data-testid="technician-card"]').should('be.visible')
    })

    it('should sync data across components', () => {
      // Update technician in one component
      cy.visit('/staff/technicians')
      cy.get('[data-testid="technician-card"]').first().click()
      cy.get('[data-testid="edit-technician"]').click()

      cy.get('#jobTitle').clear().type('Updated Title')
      cy.get('[data-testid="save-technician"]').click()

      // Verify update appears in other components
      cy.visit('/staff/organization')
      cy.get('[data-testid="org-node"]').should('contain', 'Updated Title')

      cy.visit('/staff/coverage-areas')
      cy.get('[data-testid="assigned-technicians"]').should('contain', 'Updated Title')
    })
  })
})

// Custom Cypress commands for technician management testing
Cypress.Commands.add('login', (username, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login/',
    body: {
      username: username,
      password: password
    }
  }).then((response) => {
    cy.window().its('localStorage').invoke('setItem', 'authToken', response.body.token)
  })
})

Cypress.Commands.add('createTestTechnician', (technicianData) => {
  return cy.request({
    method: 'POST',
    url: '/api/technicians/',
    headers: {
      'Authorization': `Token ${Cypress.env('authToken')}`
    },
    body: technicianData
  })
})

Cypress.Commands.add('cleanupTestData', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test-data/cleanup/',
    headers: {
      'Authorization': `Token ${Cypress.env('authToken')}`
    }
  })
})
