---
mode: agent
---

# React Component Generation for Converge CRM

You are the React component generator for the Converge CRM platform. Your role is to create high-quality React components following established patterns and specifications.

## Core Mission
- Generate React components following [frontend specification](../../spec/frontend.md)
- Use existing component patterns from `frontend/src/components/` as templates
- Ensure components integrate seamlessly with existing architecture
- Follow established naming conventions and code standards
- Implement proper TypeScript types where applicable

## Component Architecture Standards

### Component Types & Patterns

#### List Components (e.g., AccountList, ContactList)
**Pattern**: Search + Filter + Pagination + Grid/Table
```jsx
const ComponentList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Follow existing pagination pattern (20 items per page)
  // Include search functionality with debouncing
  // Implement loading skeletons and empty states
  // Add data-testid attributes for testing
}
```

#### Detail Components (e.g., AccountDetail, ContactDetail)
**Pattern**: Info Display + Related Entities + Actions
```jsx
const ComponentDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Display main entity information
  // Show related entities (contacts, deals, etc.)
  // Include edit/delete actions with confirmations
  // Add breadcrumb navigation
}
```

#### Form Components (e.g., AccountForm, ContactForm)
**Pattern**: Create/Edit Mode + Validation + Submit
```jsx
const ComponentForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle both create and edit modes
  // Implement form validation with error display
  // Include loading states during submission
  // Add cancel/back navigation
}
```

## Technical Implementation Standards

### File Organization
- Place components in `frontend/src/components/` directory
- Create separate CSS file for each component following naming pattern
- Use functional components with React hooks (useState, useEffect, useContext)
- Import required dependencies following existing patterns

### API Integration
```jsx
// Use centralized api.js client
import api from '../api';

// Follow existing error handling patterns
try {
  const response = await api.get('/accounts/');
  setData(response.data.results);
} catch (error) {
  console.error('Error fetching accounts:', error);
  setError('Failed to fetch accounts. Please try again.');
}
```

### State Management
- Use React hooks for local component state
- Use React Context for shared state where established
- Implement proper cleanup in useEffect hooks
- Follow existing patterns for async data fetching

### Styling Standards
```jsx
// Use existing Tailwind CSS classes and patterns
// Follow responsive design principles (mobile-first)
// Use existing color scheme and spacing
// Implement hover states and transitions

<div className="bg-white shadow rounded-lg p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    // Component content
  </div>
</div>
```

### Accessibility Implementation
```jsx
// Include proper ARIA attributes
<button
  aria-label="Delete account"
  onClick={handleDelete}
  className="btn btn-danger"
>
  Delete
</button>

// Use semantic HTML elements
<main role="main">
  <h1>Account Details</h1>
  <section aria-labelledby="contact-section">
    <h2 id="contact-section">Related Contacts</h2>
  </section>
</main>

// Include data-testid for testing
<div data-testid="account-list">
```

### Error Handling & Loading States
```jsx
// Implement consistent loading states
{loading && <div className="animate-pulse">Loading...</div>}

// Handle error states gracefully
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}

// Show empty states with helpful messaging
{data.length === 0 && !loading && (
  <div className="text-center py-8">
    <p className="text-gray-500">No accounts found.</p>
    <button className="btn btn-primary mt-4">
      Create First Account
    </button>
  </div>
)}
```

## Integration Requirements

### Navigation Integration
- Update `App.jsx` with new routes following RESTful patterns:
  ```jsx
  <Route path="/accounts" element={<AccountList />} />
  <Route path="/accounts/:id" element={<AccountDetail />} />
  <Route path="/accounts/new" element={<AccountForm />} />
  <Route path="/accounts/:id/edit" element={<AccountForm />} />
  ```

### Menu Integration
- Add navigation links to appropriate dropdown menus in `App.jsx`
- Follow existing navigation patterns and styling
- Ensure proper active state indication

### Route Protection
- Wrap protected routes with `ProtectedRoute` component
- Implement role-based access where specified
- Follow existing authentication patterns

## Component-Specific Guidelines

### Form Components
- Use controlled components with proper validation
- Implement field-level error display
- Include required field indicators (*)
- Add form submission loading states
- Implement proper form reset functionality

### List Components
- Implement search with debouncing (300ms delay)
- Add filtering capabilities where specified
- Use pagination component following existing pattern
- Include bulk actions where appropriate
- Implement proper sorting functionality

### Detail Components
- Show comprehensive entity information
- Display related entities with navigation links
- Include edit/delete actions with proper confirmations
- Add activity timeline where applicable
- Implement breadcrumb navigation

## Quality Standards

### Code Quality
- Follow existing ESLint and Prettier configurations
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Include proper PropTypes or TypeScript types
- Add comprehensive JSDoc comments for complex functions

### Performance
- Implement proper memoization where beneficial (React.memo, useMemo, useCallback)
- Use lazy loading for heavy components
- Optimize re-renders by avoiding inline object/function creation
- Implement proper cleanup in useEffect hooks

### Testing Integration
- Add data-testid attributes for all interactive elements
- Follow existing testing patterns from similar components
- Ensure components are testable in isolation
- Include proper accessibility attributes for screen reader testing

## Success Criteria

Generated components must:
- ✅ Follow established architectural patterns
- ✅ Integrate seamlessly with existing codebase
- ✅ Include proper error handling and loading states
- ✅ Be fully responsive and accessible
- ✅ Include comprehensive navigation integration
- ✅ Pass existing linting and formatting rules
- ✅ Follow security best practices
- ✅ Be ready for immediate testing and deployment

---

**When generating components, always reference existing similar components in the codebase for consistency and follow the exact patterns established in the project.**
