/**
 * Comprehensive CMS Workflow E2E Tests
 * TASK-088: Complete user journeys for Content Management System
 * 
 * Tests: Blog post creation → Publishing → Editing → Deletion
 *        Page creation → Publishing → SEO optimization
 *        Tag management → Assignment → Filtering
 */

describe('CMS Workflow - Complete User Journeys', () => {
  beforeEach(() => {
    // Login as content editor
    cy.login('editor', 'password');
    cy.visit('/');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('Blog Post Management - Full Lifecycle', () => {
    it('should complete full blog post workflow: create → draft → publish → edit → delete', () => {
      // Navigate to blog posts
      cy.get('[data-testid="sales-marketing-dropdown"]').click();
      cy.get('[data-testid="blog-posts-link"]').click();
      cy.url().should('include', '/blog');
      cy.waitForLoad();

      // Check accessibility
      cy.injectAxe();
      cy.checkA11y();

      // Create new blog post
      cy.get('[data-testid="new-blog-post-button"]').click();
      cy.url().should('include', '/blog/new');

      // Fill out blog post form
      const postTitle = `E2E Test Post ${Date.now()}`;
      const postSlug = postTitle.toLowerCase().replace(/\s+/g, '-');

      cy.get('[data-testid="title-input"]').type(postTitle);
      cy.get('[data-testid="slug-input"]').should('have.value', postSlug);
      
      // Rich text editor
      cy.get('[data-testid="content-editor"]').type('# Introduction\n\nThis is a test blog post created by E2E tests.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n**This is bold text** and *this is italic*.');

      // Add tags
      cy.get('[data-testid="tag-input"]').type('E2E Testing{enter}');
      cy.get('[data-testid="tag-input"]').type('Automation{enter}');
      cy.get('[data-testid="selected-tag-e2e-testing"]').should('be.visible');
      cy.get('[data-testid="selected-tag-automation"]').should('be.visible');

      // Save as draft
      cy.get('[data-testid="status-select"]').select('draft');
      cy.get('[data-testid="save-button"]').click();

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Blog post created successfully');
      cy.url().should('match', /\/blog\/\d+$/);

      // Verify draft status
      cy.get('[data-testid="post-status"]').should('contain', 'Draft');

      // Preview blog post
      cy.get('[data-testid="preview-button"]').click();
      cy.get('[data-testid="preview-modal"]').should('be.visible');
      cy.get('[data-testid="preview-title"]').should('contain', postTitle);
      cy.get('[data-testid="preview-content"]').should('contain', 'Introduction');
      cy.get('[data-testid="close-preview"]').click();

      // Publish blog post
      cy.get('[data-testid="edit-button"]').click();
      cy.get('[data-testid="status-select"]').select('published');
      cy.get('[data-testid="save-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Blog post updated successfully');
      cy.get('[data-testid="post-status"]').should('contain', 'Published');
      cy.get('[data-testid="published-date"]').should('be.visible');

      // Edit published blog post
      cy.get('[data-testid="edit-button"]').click();
      cy.get('[data-testid="content-editor"]').clear().type('# Updated Content\n\nThis content has been updated through E2E tests.');
      cy.get('[data-testid="save-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Blog post updated successfully');
      cy.get('[data-testid="post-content"]').should('contain', 'Updated Content');

      // View in blog list
      cy.visit('/blog');
      cy.get('[data-testid="blog-post-list"]').should('contain', postTitle);
      cy.get(`[data-testid="post-${postSlug}"]`).should('have.class', 'published');

      // Delete blog post
      cy.get(`[data-testid="delete-post-${postSlug}"]`).click();
      cy.get('[data-testid="confirm-delete-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Blog post deleted successfully');
      cy.get('[data-testid="blog-post-list"]').should('not.contain', postTitle);
    });

    it('should handle blog post form validation', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();

      // Try to save without required fields
      cy.get('[data-testid="save-button"]').click();

      // Check validation errors
      cy.get('[data-testid="title-error"]').should('contain', 'Title is required');
      cy.get('[data-testid="content-error"]').should('contain', 'Content is required');

      // Fill title but not content
      cy.get('[data-testid="title-input"]').type('Test Title');
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="content-error"]').should('contain', 'Content is required');

      // Fill all required fields
      cy.get('[data-testid="content-editor"]').type('Test content');
      cy.get('[data-testid="save-button"]').click();

      // Should save successfully
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should support blog post search and filtering', () => {
      cy.visit('/blog');
      cy.waitForLoad();

      // Search by title
      cy.get('[data-testid="search-input"]').type('Tutorial');
      cy.get('[data-testid="blog-post-list"]').find('[data-testid^="post-"]').each(($post) => {
        cy.wrap($post).should('contain', 'Tutorial');
      });

      // Filter by status
      cy.get('[data-testid="status-filter"]').select('published');
      cy.get('[data-testid="blog-post-list"]').find('[data-testid^="post-"]').each(($post) => {
        cy.wrap($post).should('have.class', 'published');
      });

      // Filter by tag
      cy.get('[data-testid="tag-filter"]').select('Technology');
      cy.get('[data-testid="blog-post-list"]').should('contain', 'Technology');

      // Clear filters
      cy.get('[data-testid="clear-filters"]').click();
      cy.get('[data-testid="search-input"]').should('have.value', '');
    });
  });

  describe('CMS Pages Management - Full Lifecycle', () => {
    it('should complete full page workflow: create → publish → edit → SEO optimization', () => {
      // Navigate to pages
      cy.get('[data-testid="sales-marketing-dropdown"]').click();
      cy.get('[data-testid="pages-link"]').click();
      cy.url().should('include', '/pages');

      // Create new page
      cy.get('[data-testid="new-page-button"]').click();
      cy.url().should('include', '/pages/new');

      // Fill out page form
      const pageTitle = `E2E Test Page ${Date.now()}`;
      const pageSlug = pageTitle.toLowerCase().replace(/\s+/g, '-');

      cy.get('[data-testid="title-input"]').type(pageTitle);
      cy.get('[data-testid="slug-input"]').should('have.value', pageSlug);
      cy.get('[data-testid="content-editor"]').type('<h1>Welcome</h1><p>This is a test page.</p>');

      // SEO optimization
      cy.get('[data-testid="meta-title-input"]').type(`${pageTitle} | Company Name`);
      cy.get('[data-testid="meta-description-input"]').type('This is a test page for E2E testing purposes.');
      cy.get('[data-testid="meta-keywords-input"]').type('test, e2e, automation');

      // Publish page
      cy.get('[data-testid="is-published-checkbox"]').check();
      cy.get('[data-testid="save-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Page created successfully');
      cy.get('[data-testid="published-badge"]').should('be.visible');

      // Edit page
      cy.get('[data-testid="edit-button"]').click();
      cy.get('[data-testid="content-editor"]').clear().type('<h1>Updated Welcome</h1><p>Updated content.</p>');
      cy.get('[data-testid="save-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Page updated successfully');

      // View page in list
      cy.visit('/pages');
      cy.get('[data-testid="page-list"]').should('contain', pageTitle);

      // Check SEO preview
      cy.get(`[data-testid="seo-preview-${pageSlug}"]`).click();
      cy.get('[data-testid="seo-modal"]').should('be.visible');
      cy.get('[data-testid="seo-title"]').should('contain', pageTitle);
      cy.get('[data-testid="seo-description"]').should('contain', 'This is a test page');
      cy.get('[data-testid="close-seo-modal"]').click();
    });

    it('should handle page slug uniqueness validation', () => {
      cy.visit('/pages/new');
      cy.waitForLoad();

      // Try to create page with existing slug
      cy.get('[data-testid="title-input"]').type('About Us');
      cy.get('[data-testid="slug-input"]').clear().type('about-us'); // Assume this exists
      cy.get('[data-testid="content-editor"]').type('<p>Test content</p>');
      cy.get('[data-testid="save-button"]').click();

      // Should show error
      cy.get('[data-testid="slug-error"]').should('contain', 'A page with this slug already exists');
    });
  });

  describe('Tag Management Workflow', () => {
    it('should create, edit, and delete tags', () => {
      // Navigate to tags
      cy.get('[data-testid="sales-marketing-dropdown"]').click();
      cy.get('[data-testid="tags-link"]').click();
      cy.url().should('include', '/tags');

      // Create new tag
      const tagName = `E2E Tag ${Date.now()}`;
      cy.get('[data-testid="new-tag-input"]').type(tagName);
      cy.get('[data-testid="create-tag-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Tag created successfully');
      cy.get('[data-testid="tag-list"]').should('contain', tagName);

      // Edit tag
      cy.get(`[data-testid="edit-tag-${tagName}"]`).click();
      cy.get('[data-testid="tag-name-input"]').clear().type(`${tagName} - Updated`);
      cy.get('[data-testid="save-tag-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Tag updated successfully');
      cy.get('[data-testid="tag-list"]').should('contain', `${tagName} - Updated`);

      // Delete tag
      cy.get(`[data-testid="delete-tag-${tagName}-updated"]`).click();
      cy.get('[data-testid="confirm-delete"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Tag deleted successfully');
      cy.get('[data-testid="tag-list"]').should('not.contain', tagName);
    });

    it('should assign tags to blog posts and filter by tags', () => {
      // Create a tag
      cy.visit('/tags');
      const tagName = `Filter Tag ${Date.now()}`;
      cy.get('[data-testid="new-tag-input"]').type(tagName);
      cy.get('[data-testid="create-tag-button"]').click();

      // Create blog post with tag
      cy.visit('/blog/new');
      cy.get('[data-testid="title-input"]').type('Tagged Post');
      cy.get('[data-testid="content-editor"]').type('Content with tags');
      cy.get('[data-testid="tag-input"]').type(`${tagName}{enter}`);
      cy.get('[data-testid="save-button"]').click();

      // Filter by tag in blog list
      cy.visit('/blog');
      cy.get('[data-testid="tag-filter"]').select(tagName);
      cy.get('[data-testid="blog-post-list"]').should('contain', 'Tagged Post');
    });
  });

  describe('Content Preview and Publishing', () => {
    it('should preview content before publishing', () => {
      cy.visit('/blog/new');

      cy.get('[data-testid="title-input"]').type('Preview Test Post');
      cy.get('[data-testid="content-editor"]').type('# Preview Content\n\nThis is preview test.');

      // Click preview button
      cy.get('[data-testid="preview-button"]').click();
      cy.get('[data-testid="preview-modal"]').should('be.visible');

      // Verify preview rendering
      cy.get('[data-testid="preview-title"]').should('contain', 'Preview Test Post');
      cy.get('[data-testid="preview-content"]').find('h1').should('contain', 'Preview Content');

      // Close preview
      cy.get('[data-testid="close-preview"]').click();
      cy.get('[data-testid="preview-modal"]').should('not.be.visible');
    });

    it('should schedule blog post for future publishing', () => {
      cy.visit('/blog/new');

      cy.get('[data-testid="title-input"]').type('Scheduled Post');
      cy.get('[data-testid="content-editor"]').type('Scheduled content');
      cy.get('[data-testid="status-select"]').select('scheduled');

      // Set future publish date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      cy.get('[data-testid="publish-date-input"]').type(dateString);
      cy.get('[data-testid="save-button"]').click();

      cy.get('[data-testid="success-message"]').should('contain', 'Blog post scheduled');
      cy.get('[data-testid="post-status"]').should('contain', 'Scheduled');
    });
  });

  describe('Multi-user Collaboration', () => {
    it('should show author information on blog posts', () => {
      cy.visit('/blog');
      cy.waitForLoad();

      cy.get('[data-testid^="post-"]').first().within(() => {
        cy.get('[data-testid="author-name"]').should('be.visible');
        cy.get('[data-testid="created-date"]').should('be.visible');
        cy.get('[data-testid="updated-date"]').should('be.visible');
      });
    });

    it('should filter blog posts by author', () => {
      cy.visit('/blog');

      cy.get('[data-testid="author-filter"]').select('admin');
      cy.get('[data-testid="blog-post-list"]').find('[data-testid^="post-"]').each(($post) => {
        cy.wrap($post).find('[data-testid="author-name"]').should('contain', 'admin');
      });
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should support keyboard navigation in blog post list', () => {
      cy.visit('/blog');
      cy.waitForLoad();

      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('be.visible');

      cy.realPress('Tab');
      cy.focused().should('be.visible');

      // Enter key to navigate
      cy.get('[data-testid="new-blog-post-button"]').focus();
      cy.realPress('Enter');
      cy.url().should('include', '/blog/new');
    });

    it('should have accessible form labels and error messages', () => {
      cy.visit('/blog/new');
      cy.waitForLoad();

      // Check ARIA labels
      cy.get('[data-testid="title-input"]').should('have.attr', 'aria-required', 'true');
      cy.get('[data-testid="content-editor"]').should('have.attr', 'aria-required', 'true');

      // Trigger validation errors
      cy.get('[data-testid="save-button"]').click();

      // Check error announcements
      cy.get('[data-testid="title-error"]').should('have.attr', 'role', 'alert');
    });
  });
});
