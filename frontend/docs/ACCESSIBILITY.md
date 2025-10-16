<!-- markdownlint-disable-file -->
# Accessibility Patterns

This app follows WCAG 2.1 AA with automated checks using eslint-plugin-jsx-a11y, cypress-axe, jest-axe, and Lighthouse CI.

## Form Labels and Hints

- Prefer visible labels using <label htmlFor="..."> bound to an input id.
- Use `FieldHint` to provide helper/error text and reference it via `aria-describedby`.
- Avoid relying solely on `aria-label` when a visible label is appropriate.

Example:

```jsx
<Label htmlFor="email" required>Email</Label>
<input id="email" name="email" aria-describedby="email-hint" />
<FieldHint id="email-hint">name@example.com</FieldHint>
```

## Landmarks and Structure

- Ensure unique banner, main, and contentinfo landmarks.
- Provide a skip-to-content link.
- Set document titles per route.

## Focus

- Use :focus-visible for clear focus indicators.
- Ensure modals trap focus and restore on close.
