# Implementation Plan: Styleguide and Typography Components

**Issue ID**: #3  
**Title**: Styleguide and Typography Components  
**Workpackage**: `issues/3-styleguide-and-typography-components`

## Summary

This plan implements a typography component system with Google Fonts integration and creates a styleguide page for component reference. The work includes adding the Urbanist font family to Tailwind configuration, creating semantic typography components (H1, H2, P, UL, OL, LI), and building a `/styleguide` route for previewing these components.

## Scope

### Part 1: Typography Components
- **Font Integration**: Add Urbanist Google Font to Tailwind CSS configuration
- **Component Creation**: Build typography components with consistent styling:
  - H1, H2 (headline components using ExtraBold weight)
  - P (paragraph component using Light weight as default)
  - UL, OL, LI (list components with appropriate spacing and Light weight font)
- **Styling Standards**: Implement balanced vertical spacing and readable typography scales

### Part 2: Styleguide Page
- **Route Creation**: New `/styleguide` page under `web/src/routes/styleguide.tsx`
- **Layout**: Centered content box with optimal line lengths for readability (45-75 characters per line using Tailwind's `max-w-2xl` or `max-w-3xl` classes)
- **Component Showcase**: Display all typography components with examples
- **Navigation**: Add styleguide link to existing navigation in `web/src/app.tsx`

## Out of Scope

- Complex component variants or theming beyond the specified Light/ExtraBold weights
- Component library packaging or external distribution
- Advanced typography features (responsive text sizing, custom line height utilities)
- Authentication or backend integration for the styleguide page
- Automated screenshot testing or visual regression tests

## File/Directory Map

```
web/
├── src/
│   ├── routes/
│   │   └── styleguide.tsx              # New: Styleguide preview page
│   ├── components/
│   │   └── typography/                 # New: Typography components directory
│   │       ├── H1.tsx                 # New: Headline 1 component
│   │       ├── H2.tsx                 # New: Headline 2 component
│   │       ├── P.tsx                  # New: Paragraph component
│   │       ├── UL.tsx                 # New: Unordered list component
│   │       ├── OL.tsx                 # New: Ordered list component
│   │       ├── LI.tsx                 # New: List item component
│   │       └── index.ts               # New: Export barrel for typography components
│   └── app.tsx                        # Modified: Add styleguide navigation link
├── tailwind.config.ts                 # Modified: Add Urbanist font family
└── package.json                       # No changes required
```

## Acceptance Criteria

1. **Font Integration**
   - [ ] Urbanist font family added to Tailwind configuration
   - [ ] Font loads correctly via Google Fonts CDN
   - [ ] Light (400) and ExtraBold (800) weights available

2. **Typography Components**
   - [ ] All components (H1, H2, P, UL, OL, LI) implemented with consistent interfaces
   - [ ] Components use Urbanist font family
   - [ ] Headlines use ExtraBold weight, body text and lists use Light weight
   - [ ] Balanced vertical spacing implemented
   - [ ] Components accept children and className props

3. **Styleguide Page**
   - [ ] `/styleguide` route accessible and renders correctly
   - [ ] Centered content layout with readable line lengths (45-75 characters per line using `max-w-2xl` with responsive padding)
   - [ ] All typography components displayed with sample content
   - [ ] Navigation link added to main app header
   - [ ] Page follows existing dark theme styling

4. **Integration**
   - [ ] No TypeScript errors in new components
   - [ ] All linting rules pass
   - [ ] Components integrate with existing Tailwind utilities
   - [ ] Page loads without console errors

## Test Plan

1. **Manual Testing**
   - Navigate to `/styleguide` and verify page loads
   - Check font rendering across different browsers
   - Verify typography hierarchy and spacing
   - Test component props acceptance (className, children)
   - Validate responsive behavior on different screen sizes

2. **Automated Testing**
   - Run `pnpm lint` to ensure code quality
   - Run `pnpm typecheck` to verify TypeScript compilation
   - Run `pnpm test` for any existing test suites
   - Verify build process with `pnpm build`

3. **Accessibility Testing**
   - Check semantic HTML structure in components
   - Verify heading hierarchy (H1 > H2)
   - Test keyboard navigation on styleguide page
   - Validate color contrast ratios

## Risks

1. **Font Loading**: Google Fonts dependency may impact performance
   - *Mitigation*: Use font-display: swap and preload hint
   
2. **Component API**: Typography components may need props evolution
   - *Mitigation*: Start with minimal, extensible interface
   
3. **Spacing Consistency**: Typography spacing may not align with existing components
   - *Mitigation*: Follow existing Tailwind spacing scale patterns

## Rollback Plan

1. Remove `/styleguide` route file
2. Revert Tailwind configuration changes
3. Remove typography components directory
4. Revert navigation changes in `app.tsx`
5. Verify application builds and runs correctly

## CI Updates

No CI pipeline changes required. Standard linting, type checking, and build processes will validate the implementation.

## Documentation Updates

- **ADR Consideration**: Font integration represents an architectural choice for typography system. Consider adding `docs/ADR/0002-typography-system.md` to document font selection and component patterns.
- **Architecture Reference**: Link to [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for frontend stack context
- **Codebase Overview**: Changes align with component organization described in [docs/CODEBASE_OVERVIEW.md](../../docs/CODEBASE_OVERVIEW.md)

## Implementation Notes

- Follow existing component patterns from `web/src/components/Counter.tsx`
- Use SolidJS best practices for component interfaces
- Maintain consistency with current dark theme in `web/src/app.tsx:13-14`
- Leverage existing Tailwind utilities where possible
- Ensure components are tree-shakeable through proper exports