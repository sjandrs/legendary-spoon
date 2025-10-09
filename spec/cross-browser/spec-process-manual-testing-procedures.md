---
title: Manual Testing Procedures for Cross-Browser Compatibility
version: 1.0
date_created: 2025-10-04
last_updated: 2025-10-04
owner: QA Team
tags: [cross-browser, manual-testing, procedures, qa, checklist]
---

# Manual Testing Procedures for Cross-Browser Compatibility

## 1. Purpose & Scope

This specification defines comprehensive manual testing procedures for validating cross-browser compatibility when automated tests cannot fully capture visual, UX, or subjective quality issues.

**Purpose:**
- Establish standardized manual testing workflows
- Define comprehensive testing checklists for each browser
- Document visual verification procedures
- Ensure consistent quality assessment across browsers

**Scope:**
- Desktop browser manual testing (Chrome, Firefox, Safari, Edge)
- Mobile browser manual testing (iOS Safari, Chrome Mobile)
- Visual regression verification
- User experience validation
- Exploratory testing procedures
- Issue documentation and reporting

**Target Audience:**
- QA Engineers
- Manual Testers
- Product Managers
- UX/UI Designers

## 2. Definitions

**Manual Testing:** Human-performed testing to validate application behavior, UI/UX, and visual quality.

**Exploratory Testing:** Unscripted testing where tester explores the application to find defects.

**Visual Regression:** Unintended visual changes between application versions.

**User Acceptance:** Validation that application meets user expectations and requirements.

**Critical Path:** Essential user workflows that must work for application to be viable.

**Smoke Testing:** Quick validation of core functionality to ensure basic operation.

**Sanity Testing:** Focused testing of specific functionality after changes.

## 3. Requirements, Constraints & Guidelines

### Manual Testing Requirements

**REQ-301:** Critical user paths MUST be manually tested in all Tier 1 browsers before production release.

**REQ-302:** Visual verification MUST be performed for all major UI components in each browser.

**REQ-303:** Manual testing checklist MUST be completed and signed off by QA lead.

**REQ-304:** Browser-specific UI differences MUST be documented with screenshots.

**REQ-305:** Issues found during manual testing MUST be logged with reproduction steps.

### Testing Coverage Requirements

**REQ-306:** Manual testing MUST cover features not easily automated:
- Visual layout and spacing
- Typography rendering
- Color and contrast
- Hover/focus states
- Drag-and-drop interactions
- File upload dialogs
- Print stylesheets

**REQ-307:** Exploratory testing MUST be conducted for 2 hours per browser per release.

**REQ-308:** Real device testing MUST be performed for mobile browsers (not just emulators).

### Documentation Requirements

**REQ-309:** Test execution MUST be documented in test management system.

**REQ-310:** Screenshots MUST be captured for all visual defects.

**REQ-311:** Browser configuration MUST be documented (version, OS, resolution).

**REQ-312:** Pass/fail criteria MUST be clearly defined for each test case.

### Constraints

**CON-301:** Manual testing is time-consuming and resource-intensive.

**CON-302:** Subjective quality assessments may vary between testers.

**CON-303:** Real device availability may limit mobile testing coverage.

**CON-304:** Manual testing cannot be easily repeated for regression validation.

### Guidelines

**GUD-301:** Test in standardized browser configurations (clean profile, no extensions).

**GUD-302:** Use consistent viewport sizes for comparable testing (1920x1080 desktop).

**GUD-303:** Document both expected and actual results for failed tests.

**GUD-304:** Prioritize critical paths over comprehensive feature coverage.

**GUD-305:** Use screen recording tools for complex reproduction steps.

**GUD-306:** Perform blind testing (without knowing expected results) when possible.

## 4. Interfaces & Data Contracts

### Manual Test Case Template

\\\	ypescript
interface ManualTestCase {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Navigation' | 'CRM' | 'Analytics' | 'CMS' | 'Admin' | 'Accessibility';
  prerequisites: string[];
  steps: Array<{
    stepNumber: number;
    action: string;
    expectedResult: string;
  }>;
  browsers: Array<'Chrome' | 'Firefox' | 'Safari' | 'Edge'>;
  testData?: Record<string, any>;
}
\\\

### Test Execution Result

\\\	ypescript
interface ManualTestResult {
  testCaseId: string;
  executedBy: string;
  executedAt: string;
  browser: {
    name: string;
    version: string;
    os: string;
    resolution: string;
  };
  status: 'Pass' | 'Fail' | 'Blocked' | 'Skip';
  actualResult?: string;
  defects: Array<{
    severity: 'Critical' | 'Major' | 'Minor' | 'Cosmetic';
    description: string;
    screenshots: string[];
    reproductionSteps: string[];
  }>;
  notes: string;
  duration: number;
}
\\\

### Issue Report Template

\\\	ypescript
interface CrossBrowserIssue {
  id: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Cosmetic';
  affectedBrowsers: Array<{
    name: string;
    version: string;
  }>;
  reproductionSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  screenshots: string[];
  videoUrl?: string;
  workaround?: string;
  relatedTestCases: string[];
  assignedTo?: string;
  status: 'Open' | 'In Progress' | 'Fixed' | 'Wont Fix' | 'Duplicate';
}
\\\

## 5. Acceptance Criteria

**AC-301:** Given manual test checklist, When executed, Then all critical paths MUST pass in all Tier 1 browsers.

**AC-302:** Given visual verification, When compared, Then acceptable visual variance MUST be <2% across browsers.

**AC-303:** Given defects found, When logged, Then reproduction steps MUST be clear enough for developers to reproduce.

**AC-304:** Given manual testing completion, When reviewed, Then QA lead MUST approve before production deployment.

**AC-305:** Given exploratory testing, When completed, Then findings MUST be documented and prioritized.

**AC-306:** Given mobile testing, When performed, Then real devices MUST be used for at least iOS Safari and Chrome Mobile.

## 6. Test Automation Strategy

### Manual vs. Automated Testing

**Manual Testing Focus:**
- Visual quality and consistency
- Subjective UX evaluation
- Complex multi-step workflows
- Edge cases and boundary conditions
- Exploratory discovery of unknown issues

**Automated Testing Focus:**
- Repetitive regression testing
- Data validation
- API integration testing
- Performance benchmarking
- Accessibility rule validation

### Integration with Automated Tests

**INT-301:** Manual testing SHOULD be performed after automated tests pass.

**INT-302:** Manual test cases SHOULD be automated when feasible.

**INT-303:** Visual regression tools (Percy) SHOULD be used to reduce manual visual verification.

## 7. Rationale & Context

### Why Manual Testing is Essential

**Automation Limitations:**
- Cannot evaluate subjective quality (aesthetics, UX feel)
- May miss visual rendering issues
- Cannot fully test complex user interactions
- Limited ability to discover unknown issues

**Human Expertise:**
- Testers bring domain knowledge and intuition
- Can identify usability problems automated tests miss
- Flexible approach adapts to unexpected scenarios
- Provides user perspective

### Balance with Automation

**80/20 Rule:** 80% of testing automated, 20% manual for high-value validation.

**Risk-Based Approach:** Prioritize manual testing for high-risk, high-impact features.

## 8. Dependencies & External Integrations

### External Systems

**EXT-301:** Test Management System (e.g., TestRail, Zephyr) - Manual test case management.

**EXT-302:** Jira/GitHub Issues - Defect tracking and workflow.

### Third-Party Services

**SVC-301:** BrowserStack/Sauce Labs - Real browser and device testing.

**SVC-302:** LambdaTest - Cross-browser visual testing platform.

**SVC-303:** Screen recording tools (Loom, OBS) - Reproduction documentation.

### Infrastructure Dependencies

**INF-301:** Real devices for mobile testing (iPhone, Android devices).

**INF-302:** Multiple OS environments (Windows, macOS, Linux) for browser testing.

**INF-303:** High-resolution displays for accurate visual verification.

### Technology Platform Dependencies

**PLT-301:** Modern browsers installed (Chrome, Firefox, Safari, Edge).

**PLT-302:** Development/staging environment accessible for testing.

## 9. Examples & Edge Cases

### Example: Manual Test Case - Navigation Dropdown

\\\markdown
**Test Case ID:** MT-001
**Title:** Verify CRM Dropdown Navigation
**Priority:** Critical
**Category:** Navigation

**Prerequisites:**
- User logged in as Sales Manager
- Dashboard page loaded

**Test Steps:**

1. **Action:** Hover mouse over "CRM" navigation item
   **Expected:** Dropdown menu appears with smooth animation (<200ms)

2. **Action:** Verify dropdown menu items
   **Expected:** Menu contains: Accounts, Contacts, Deals, Quotes, Interactions, Activity Timeline

3. **Action:** Click "Accounts" menu item
   **Expected:** Navigates to /accounts page, menu closes

4. **Action:** Use keyboard (Tab) to navigate to CRM dropdown
   **Expected:** Dropdown receives focus indicator

5. **Action:** Press Enter key
   **Expected:** Dropdown opens, focus moves to first menu item

6. **Action:** Use Arrow Down key
   **Expected:** Focus moves to next menu item

7. **Action:** Press Enter on "Contacts"
   **Expected:** Navigates to /contacts page

**Browsers:** Chrome, Firefox, Safari, Edge

**Pass Criteria:**
- All menu items visible and correctly styled
- Hover/focus states work consistently
- Keyboard navigation functional
- Transitions smooth (no visual glitches)
\\\

### Example: Visual Verification Checklist

\\\markdown
**Feature:** Deal Pipeline Dashboard

**Visual Elements to Verify:**

 **Typography**
- [ ] Font family renders correctly
- [ ] Font weights display properly (light, regular, bold)
- [ ] Line height and spacing consistent
- [ ] Text is readable and crisp

 **Layout**
- [ ] Grid layout renders correctly
- [ ] Card spacing uniform
- [ ] Responsive breakpoints trigger appropriately
- [ ] No content overflow or clipping

 **Colors**
- [ ] Brand colors match design system
- [ ] Hover states use correct colors
- [ ] Focus indicators visible (3:1 contrast)
- [ ] Disabled states clearly differentiated

 **Interactive Elements**
- [ ] Buttons render with correct styling
- [ ] Hover states animate smoothly
- [ ] Click states provide feedback
- [ ] Loading states display appropriately

 **Charts & Visualizations**
- [ ] Chart.js renders correctly
- [ ] Data labels legible
- [ ] Tooltips display on hover
- [ ] Legends positioned correctly

 **Icons & Images**
- [ ] SVG icons render sharply
- [ ] Image loading smooth
- [ ] Fallbacks display for missing images
- [ ] Icons aligned with text
\\\

### Example: Exploratory Testing Session

\\\markdown
**Session:** Exploratory Testing - CMS Blog Post Creation
**Tester:** Jane Doe
**Browser:** Firefox 122 on Windows 11
**Duration:** 30 minutes
**Focus Area:** Rich text editor and media upload

**Findings:**

1. **Issue:** Markdown preview not updating in real-time
   - **Severity:** Minor
   - **Steps:** Type markdown syntax, preview doesn't update until blur
   - **Expected:** Real-time preview like GitHub

2. **Observation:** Image upload drag-and-drop works smoothly
   - **Positive finding:** Better UX than expected

3. **Issue:** Keyboard shortcut Ctrl+B for bold doesn't work
   - **Severity:** Minor
   - **Expected:** Common keyboard shortcuts supported
   - **Actual:** No keyboard shortcut support

4. **Observation:** Auto-save functionality works well
   - **Positive finding:** No data loss during testing

**Recommendations:**
- Add real-time markdown preview
- Implement standard keyboard shortcuts
- Add tooltip for available shortcuts
\\\

### Edge Case: Browser-Specific Date Picker

\\\markdown
**Test Case:** Date Picker Input Cross-Browser Compatibility

**Chrome/Firefox/Edge:**
- Native date picker with calendar popup
- Consistent styling and behavior
- Keyboard accessible

**Safari:**
- Native macOS date picker (different UI)
- Scrollable wheels for date selection
- Different but acceptable UX pattern

**Test Approach:**
1. Verify date selection works in all browsers
2. Ensure selected date saves correctly
3. Validate form submission with date value
4. Document visual differences (acceptable variance)

**Acceptance:**
- Functionality works in all browsers
- Visual differences documented
- No user complaints expected
\\\

## 10. Validation Criteria

**VAL-301:** Manual testing checklist completed for all Tier 1 browsers.

**VAL-302:** All critical and high-priority test cases executed and passed.

**VAL-303:** Visual verification performed for all major UI components.

**VAL-304:** Exploratory testing sessions completed (minimum 2 hours per browser).

**VAL-305:** All defects logged with severity, reproduction steps, and screenshots.

**VAL-306:** QA lead sign-off obtained before production deployment.

**VAL-307:** Mobile testing performed on real devices (iOS Safari, Chrome Mobile).

## 11. Related Specifications / Further Reading

- [spec-tool-cross-browser-testing-strategy.md](./spec-tool-cross-browser-testing-strategy.md)
- [spec-tool-browser-compatibility-matrix.md](./spec-tool-browser-compatibility-matrix.md)
- [spec-data-test-scenarios-workflows.md](./spec-data-test-scenarios-workflows.md)
- [spec-tool-accessibility-testing.md](./spec-tool-accessibility-testing.md)
- [ISO 25010 Software Quality Model](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)
- [ISTQB Manual Testing Principles](https://www.istqb.org/)
