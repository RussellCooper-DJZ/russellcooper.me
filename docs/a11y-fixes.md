# Accessibility Fixes Log

## v1.2.0 — 2026-03-28

### Fixed Issues

#### WCAG 2.1 AA Compliance

- **[HIGH]** Added `aria-label` to all icon-only buttons in the navigation bar
- **[HIGH]** Fixed keyboard focus trap in mobile menu — now properly cycles focus within the menu
- **[MEDIUM]** Added `aria-live="polite"` region to the animated counter component
- **[MEDIUM]** Improved color contrast on secondary text from 3.8:1 to 5.2:1
- **[LOW]** Added `lang="en"` attribute to the root `<html>` element
- **[LOW]** Fixed missing `alt` text on decorative SVG icons (added `aria-hidden="true"`)

### New Features

- Added skip navigation link (`#main-content`) for keyboard users
- Implemented `prefers-reduced-motion` media query for all CSS animations
- Added focus-visible polyfill for consistent focus ring behavior across browsers

### Testing

All fixes verified with:
- axe DevTools v4.9 (0 violations)
- NVDA 2024.1 + Chrome
- VoiceOver + Safari on macOS 14
- Keyboard-only navigation testing
