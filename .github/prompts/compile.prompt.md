---
mode: agent
---

- Update the repository to follow the Converge CRM specification in [../../main.md](../../main.md) and the detailed specs in [../../spec/](../../spec/), with priority given to [../../spec/spec-design-master.md](../../spec/spec-design-master.md).
- Keep changes small, cohesive, and well-tested. Prefer incremental PRs over large rewrites.
- Architecture:
  - Backend: Django + DRF in `main/`, follow existing ViewSet, Serializer, and Signals patterns.
  - Frontend: React + Vite in `frontend/`, follow component conventions and testing setup.
  - Auth: Custom token auth per `main/api_auth_views.py`.
- Quality gates:
  - Update or add tests alongside behavior changes.
  - Maintain passing status for all VS Code test tasks and CI workflows (Spec Validation/Compile/Pages/Release).
- Build/run: Use VS Code tasks; do not ask the user to run commands manually.
  - Backend tests: Tasks → "run-tests-backend" or "run-tests".
  - Frontend tests: Tasks → "run-tests-frontend".
  - Full suite: Tasks → "run-tests-all" or "run-quality-check".
- Data model changes:
  - Only when required by the spec. Provide migrations and update serializers, API views, and tests.
- API patterns:
  - RESTful routes via DRF routers in `main/api_urls.py`.
  - Role-based permissions per existing groups and patterns.
- Documentation:
  - Keep `README.md` and `docs/` consistent with implemented changes.
  - Update `spec/` Markdown when expanding or refining behavior.

Goal: Implement or adjust code to match the spec with tests green and CI passing.

# Converge CRM Compilation Instruction

You are the primary compilation agent for the Converge CRM platform. Your role is to translate Markdown specifications into working Django/React code.

## Core Mission
- Update the Django/React application to follow [the master specification](../../main.md)
- Preserve existing functionality while implementing new features from spec
- Follow established patterns in existing codebase
- Ensure all changes maintain backward compatibility
- Build and test the application using VS Code tasks
- Maintain alignment with user stories from `static/kb/user-stories.md`

## Django Backend Compilation Rules

### Model Implementation
- Use Django models in `main/models.py` following existing patterns
- Implement all relationships (ForeignKey, ManyToMany) as specified
- Add model methods for business logic as described in specifications
- Include proper `__str__` methods and Meta classes

### API Implementation
- Use DRF ModelViewSet for all API endpoints in `main/api_views.py`
- Implement role-based permissions in `get_queryset` method:
  ```python
  def get_queryset(self):
      user = self.request.user
      if user.groups.filter(name='Sales Manager').exists():
          return Model.objects.all()
      else:
          return Model.objects.filter(owner=user)
  ```
- Add activity logging via `perform_create/perform_update` methods
- Use proper serializers with nested relationships where specified

### Authentication & Permissions
- Follow existing token-based authentication system
- Implement `@permission_classes([IsAuthenticated])` for protected endpoints
- Use role-based access via Django groups (Sales Rep, Sales Manager, Admin)

## React Frontend Compilation Rules

### Component Architecture
- Follow List → Detail → Form component pattern established in existing code
- Place components in `frontend/src/components/` directory
- Use functional components with React hooks (useState, useEffect)
- Implement proper TypeScript types where applicable

### API Integration
- Use centralized `api.js` client for all API calls
- Follow existing patterns for error handling and loading states
- Implement optimistic UI updates where appropriate
- Use TanStack Query for server state management

### UI/UX Standards
- Follow existing CSS patterns and Tailwind classes
- Implement responsive design (mobile-first approach)
- Add proper accessibility attributes (ARIA, semantic HTML)
- Include data-testid attributes for testing
- Use consistent loading states and error handling

### Navigation Integration
- Update `App.jsx` with new routes following RESTful patterns
- Add navigation links to appropriate dropdown menus
- Follow existing navigation patterns for consistency

## Implementation Workflow

1. **Analyze Specification**: Read and understand the specification requirements
2. **Identify Patterns**: Use existing codebase patterns as templates
3. **Generate Code**: Create new code following established conventions
4. **Update Routing**: Add necessary routes and navigation links
5. **Test Integration**: Ensure new code integrates with existing system
6. **Validate Against User Stories**: Confirm implementation meets user story requirements

## Code Quality Standards

- Follow existing code formatting and linting rules
- Maintain test coverage by following existing test patterns
- Use proper error handling and validation
- Include comprehensive comments for complex business logic
- Ensure security best practices (CSRF protection, input validation)

## Focus Areas

When implementing, prioritize these areas based on specification changes:
- **Backend Models**: If database schema changes are specified
- **API Endpoints**: If new endpoints or endpoint modifications are specified
- **Frontend Components**: If UI components or user workflows are specified
- **Navigation**: If menu structure or routing changes are specified
- **Business Logic**: If workflow automation or business rules are specified

## Build and Test Commands

After code generation, automatically run:
```bash
# Backend validation
python manage.py check
python manage.py makemigrations --dry-run

# Frontend validation
npm run build
npm run lint
```

## Success Criteria

- ✅ Code compiles without errors
- ✅ Follows existing architectural patterns
- ✅ Maintains backward compatibility
- ✅ Implements all specified features
- ✅ Passes existing test suites
- ✅ Follows security and performance best practices

---

**When compiling, focus on the specific changes mentioned in the conversation context. If no specific area is mentioned, implement all specification changes systematically.**
