# Implementation Plan: Introduce MDX

## Summary

This plan introduces MDX support to the SolidStart application, enabling the rendering of Markdown content as React components at the `/mdx` route. The implementation will leverage the existing typography components and maintain consistency with the application's design system.

## Scope

### In Scope

- Add MDX processing capability using `@vinxi/plugin-mdx` and `solid-mdx`
- Create new `/mdx` route that renders MDX content
- Configure MDX to use existing typography components (H1, H2, P, UL, OL, LI)
- Implement proper layout integration following existing routing patterns
- Add navigation link to the new MDX route
- Create sample MDX content for demonstration

### Out of Scope

- Dynamic MDX file selection/routing (single fixed MDX file for this implementation)
- MDX file upload functionality
- Content management system features
- Advanced MDX features like custom components beyond typography
- SEO optimization beyond basic meta tags

## File/Directory Map

```
web/
├── src/
│   ├── routes/
│   │   └── mdx.tsx                    # New MDX route component
│   ├── content/
│   │   └── sample.mdx                 # Sample MDX content file
│   └── app.tsx                        # Updated navigation (add MDX link)
├── package.json                       # Add MDX dependencies
├── app.config.ts                      # Add MDX plugin configuration
└── vite.config.ts                     # May need MDX configuration
```

## Implementation Details

### Phase 1: Dependencies and Configuration

1. **Add Dependencies**

   - `@vinxi/plugin-mdx` - Vinxi MDX plugin for build-time processing
   - `solid-mdx` - SolidJS provider for MDX components
   - `@mdx-js/mdx` - Core MDX processor (if not included)

2. **Configure Build System**
   - Update `app.config.ts` to include MDX plugin with SolidJS integration
   - Configure MDX to use `solid-js` as JSX import source
   - Set provider import source to `solid-mdx`
   - Enable `.mdx` and `.md` extensions

### Phase 2: MDX Route Implementation

1. **Create MDX Route** (`web/src/routes/mdx.tsx`)

   - Import and render MDX content
   - Use existing layout and styling patterns
   - Configure MDX provider with typography components
   - Add proper meta tags using `@solidjs/meta`

2. **Sample Content** (`web/src/content/sample.mdx`)
   - Create demonstration content showcasing all typography components
   - Include headings, paragraphs, lists to validate component integration
   - Add frontmatter for title and meta information

### Phase 3: Integration and Navigation

1. **Update Navigation** (`web/src/app.tsx`)

   - Add MDX link to header navigation
   - Follow existing navigation patterns and styling

2. **Component Mapping**
   - Configure MDX to use existing typography components
   - Map standard markdown elements to custom components:
     - `h1` → `H1`
     - `h2` → `H2`
     - `p` → `P`
     - `ul` → `UL`
     - `ol` → `OL`
     - `li` → `LI`

## Acceptance Criteria

- [ ] New `/mdx` route accessible and renders properly
- [ ] Content of the page is dynamically coming from MDX, not manually crafted from MDX to HTML
- [ ] MDX content uses existing typography components
- [ ] Layout wrapper applied consistently with other routes
- [ ] Navigation includes working link to MDX route
- [ ] Sample content demonstrates all supported components
- [ ] Build process succeeds without errors
- [ ] TypeScript compilation passes
- [ ] Styling matches application design system

## Test Plan

### Manual Testing

1. **Navigation Testing**

   - Verify `/mdx` route loads without errors
   - Confirm navigation link works and shows active state
   - Test responsive behavior on different screen sizes

2. **Content Rendering**

   - Validate all typography components render correctly
   - Check that MDX content follows application styling
   - Verify layout consistency with other routes

3. **Build Testing**
   - Run `npm run build` to ensure no build errors
   - Test production build serves MDX route correctly

### Automated Testing

- Update existing route tests if needed
- Add basic smoke test for MDX route rendering
- Include MDX route in any navigation tests

## Risks

### Medium Risk

- **MDX Plugin Compatibility**: `@vinxi/plugin-mdx` may have version conflicts with current SolidStart setup

  - _Mitigation_: Test with minimal configuration first, check SolidStart documentation for recommended versions

- **TypeScript Integration**: MDX imports may require additional TypeScript configuration
  - _Mitigation_: Add necessary type declarations, follow SolidJS MDX examples

### Low Risk

- **Build Performance**: Adding MDX processing may impact build times
  - _Mitigation_: Monitor build performance, consider optimizations if needed

## Rollback Plan

1. **Remove Dependencies**: Uninstall MDX-related packages from package.json
2. **Revert Configuration**: Remove MDX plugin from app.config.ts
3. **Remove Files**: Delete `/mdx` route and content files
4. **Restore Navigation**: Remove MDX link from navigation
5. **Verify Build**: Ensure application builds and runs without MDX

## CI Updates

No CI pipeline changes required. Existing linting, type checking, and build verification will cover the new MDX implementation.

## Documentation Updates

### ADR Consideration

Adding MDX support introduces a new dependency and build-time processing step. Consider creating `0003-mdx-integration.md` ADR to document:

- Decision to use `@vinxi/plugin-mdx` over alternatives
- Component mapping strategy
- Build-time vs runtime processing choice

### References

- [Architecture](../docs/ARCHITECTURE.md) - Frontend stack and routing patterns
- [Codebase Overview](../docs/CODEBASE_OVERVIEW.md) - Application structure
- [Typography Components](../web/src/components/typography/) - Existing component system
