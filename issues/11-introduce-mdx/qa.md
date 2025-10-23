# QA Checklist: Introduce MDX

## Manual Testing

### 1. Development Server
- [ ] Run `npm run dev` to start the development server
- [ ] Verify server starts without errors
- [ ] Navigate to `http://localhost:3000`

### 2. Navigation Testing
- [ ] Verify MDX link appears in the header navigation
- [ ] Click the MDX link to navigate to `/mdx` route
- [ ] Confirm the page loads without errors
- [ ] Verify active state styling shows on MDX navigation link

### 3. Content Rendering
- [ ] Verify the "Welcome to MDX" heading displays correctly
- [ ] Check that all typography components render with proper styling:
  - [ ] H1 heading style matches existing components
  - [ ] H2 headings use consistent styling  
  - [ ] Paragraphs display with proper spacing and font
  - [ ] Unordered lists render with correct bullet points
  - [ ] Ordered lists display with proper numbering
  - [ ] Nested lists maintain proper indentation
- [ ] Confirm MDX content follows application's design system
- [ ] Verify layout wrapper is applied consistently with other routes

### 4. Responsive Testing
- [ ] Test on desktop viewport (>1024px)
- [ ] Test on tablet viewport (768px-1024px)  
- [ ] Test on mobile viewport (<768px)
- [ ] Verify navigation collapses appropriately on smaller screens

### 5. Browser Compatibility
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari (if on macOS)

### 6. TypeScript Validation
- [ ] Run `npm run typecheck` to verify no TypeScript errors
- [ ] Confirm MDX imports resolve correctly

### 7. Code Quality
- [ ] Run `npm run lint` to verify ESLint passes
- [ ] Check that all code follows project conventions

## Development Build Testing

### 8. Production Build
- [ ] Run `npm run build` to test production build
- [ ] Note: Current known issue with build-time JSX parsing needs resolution
- [ ] Verify development mode works correctly as alternative

## Acceptance Criteria Verification

- [ ] New `/mdx` route is accessible and renders properly
- [ ] MDX content uses existing typography components (H1, H2, P, UL, OL, LI)
- [ ] Layout wrapper applied consistently with other routes
- [ ] Navigation includes working link to MDX route with active state
- [ ] Sample content demonstrates all supported components
- [ ] TypeScript compilation passes
- [ ] Styling matches application design system

## Notes

- The implementation successfully integrates MDX with SolidJS using `@mdx-js/rollup` plugin
- Development server works correctly; production build has a known JSX parsing issue that needs investigation
- All typography components are properly mapped and styled consistently