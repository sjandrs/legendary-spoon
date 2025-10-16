---
mode: principal-software-engineer
model: GPT-5
---
<!-- markdownlint-disable-file -->
# Implementation Prompt: Phase 7 Internationalization & Localization Implementation

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20251012-phase-7-internationalization-localization-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/task-implementation.instructions.md
You WILL systematically implement #file:../plans/20251012-phase-7-internationalization-localization-plan.instructions.md task-by-task
You WILL follow ALL project standards and conventions
you WILL track completions in the Implementation Approach section below.

**CRITICAL**: If ${input:phaseStop:false} is true, you WILL stop after each Phase for user review.
**CRITICAL**: If ${input:taskStop:false} is true, you WILL stop after each Task for user review.

## Implementation Approach

#### Phase 7.1: Foundation Setup (Week 1-2)
- **Task 7.1.1**: Install react-i18next ecosystem with proper version constraints and TypeScript support configuration
- **Task 7.1.2**: Configure I18nextProvider integration with Suspense fallback for async translation loading
- **Task 7.1.3**: Replace hardcoded strings in 5-10 core components establishing translation patterns

#### Phase 7.2: Translation Infrastructure (Week 3-4)
- **Task 7.2.1**: Setup i18next-cli automated key extraction system with component pattern recognition
- **Task 7.2.2**: Create namespace organization structure (common, dashboard, forms, navigation, errors)
- **Task 7.2.3**: Implement CI integration for automated translation file management and synchronization

#### Phase 7.3: Locale Infrastructure Replacement (Week 5-6)
- **Task 7.3.1**: Replace all hardcoded Intl.NumberFormat('en-US') with dynamic locale from i18n context
- **Task 7.3.2**: Replace hardcoded toLocaleDateString('en-US') with locale-aware formatting functions
- **Task 7.3.3**: Implement user locale preferences UI with localStorage persistence

#### Phase 7.4: Component Translation (Week 7-10)
- **Task 7.4.1**: Translate core CRM components (Contacts, Deals, Tasks) with proper translation key usage
- **Task 7.4.2**: Translate financial components (Accounting, Reports, Invoicing) with financial terminology
- **Task 7.4.3**: Translate operational components (Warehouse, Field Service, Staff) completing UI localization

#### Phase 7.5: Advanced Features (Week 11-12)
- **Task 7.5.1**: Implement timezone-aware date handling with user-specific timezone detection
- **Task 7.5.2**: Add multi-currency support with dynamic selection based on locale preferences
- **Task 7.5.3**: Implement RTL language support for Arabic/Hebrew with proper layout adjustments

#### Phase 7.6: Backend Enhancement (Week 13-14)
- **Task 7.6.1**: Enhance Django APIs with Accept-Language header support for localized responses
- **Task 7.6.2**: Implement localized error messages and validation for multi-language API support
- **Task 7.6.3**: Add timezone-aware API serialization for proper temporal data handling

#### Phase 7.7: Testing & Quality Assurance (Week 15-16)
- **Task 7.7.1**: Implement comprehensive i18n testing suite covering locale switching and translation loading
- **Task 7.7.2**: Add accessibility testing ensuring WCAG 2.1 AA compliance for all supported locales
- **Task 7.7.3**: Optimize performance with lazy loading and caching for translation files

### Quality Assurance (**CRITICAL** - MUST be followed)

For each task completion, you WILL verify:
- [ ] Dynamic locale switching works instantly across all affected components
- [ ] Translation keys properly extracted and organized by namespace
- [ ] Currency, date, and number formatting respects user locale dynamically
- [ ] Frontend tests pass with i18n functionality validated
- [ ] Backend APIs respond with localized content based on Accept-Language
- [ ] RTL languages display correctly with proper layout adjustments
- [ ] Accessibility compliance maintained across all locales
- [ ] Performance optimized with efficient translation loading
- [ ] User preferences persist across browser sessions

**CRITICAL**: All implementation tasks and quality assurance goals MUST be completed before proceeding.

### Step 3: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:
  1. You WILL provide a markdown style link and a summary of all changes from #file:../changes/20251012-phase-7-internationalization-localization-changes.md to the user:
    - You WILL keep the overall summary brief
    - You WILL add spacing around any lists
    - You MUST wrap any reference to a file in a markdown style link
  2. You WILL provide markdown style links to .copilot-tracking/plans/20251012-phase-7-internationalization-localization-plan.instructions.md, .copilot-tracking/details/20251012-phase-7-internationalization-localization-details.md, and .copilot-tracking/research/20251012-phase-6-7-test-coverage-i18n-research.md documents.
  <!-- 3. **MANDATORY**: You WILL attempt to delete .copilot-tracking/prompts/implement-phase-7-internationalization-localization.prompt.md -->

## Success Criteria

- [ ] Changes tracking file created
- [ ] All plan items implemented with working code
- [ ] All detailed specifications satisfied
- [ ] Project conventions followed
- [ ] Changes file updated continuously
- [ ] All 63+ frontend components support dynamic locale switching
- [ ] Translation key extraction automated with CI integration
- [ ] Dynamic formatting (currency/date/number) respects user locale
- [ ] At least 3 canonical locales fully supported (English, Spanish, French/Arabic)
- [ ] Backend APIs localized with Accept-Language header support
- [ ] RTL languages operational with proper layout adjustments
- [ ] User timezone preferences applied consistently
- [ ] Comprehensive i18n testing suite with accessibility validation
- [ ] Performance optimized with lazy loading and caching strategies
