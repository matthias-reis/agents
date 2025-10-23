# Implementation Plan: Tailwind 4 Migration

## Summary

Upgrade the web application from Tailwind CSS 3.4.18 to Tailwind CSS 4.x to leverage modern CSS features, improved performance, and updated configuration patterns. This migration involves updating dependencies, migrating configuration from JavaScript to CSS-first approach, and ensuring visual consistency.

## Scope

### In Scope
- Update Tailwind CSS dependency from v3.4.18 to latest v4.x
- Migrate `tailwind.config.ts` configuration to CSS-first approach
- Update `root.css` to use new v4 import syntax
- Verify visual consistency across all components and routes
- Update documentation references to Tailwind v4
- Create ADR for dependency architecture change

### Out of Scope
- Redesigning existing UI components
- Adding new Tailwind features beyond migration requirements
- Updating other frontend dependencies unless required for compatibility
- Performance optimization beyond what v4 provides automatically

## File/Directory Map

```
web/
├── package.json                 # Update tailwindcss dependency to v4.x
├── tailwind.config.ts          # Migrate config or remove if using CSS-first
├── postcss.config.cjs          # Verify compatibility, may need updates
├── src/
│   ├── root.css                # Replace @tailwind directives with @import
│   ├── app.tsx                 # Verify no visual regressions
│   ├── components/             # Test all components for visual consistency
│   │   ├── Counter.tsx
│   │   └── typography/         # Verify typography components still work
│   └── routes/                 # Test all routes for visual consistency
│       ├── index.tsx
│       ├── about.tsx
│       └── styleguide.tsx
├── tests/                      # Run existing tests to ensure no regressions
└── README.md                   # Update Tailwind version reference

docs/
├── ARCHITECTURE.md             # Update Tailwind version reference
└── ADR/
    └── 0002-tailwind-v4-migration.md  # New ADR for dependency change
```

## Acceptance Criteria

- [ ] Tailwind CSS v4.x (latest stable) is installed as dependency
- [ ] Configuration migrated from `tailwind.config.ts` to CSS-first approach or updated for v4 compatibility  
- [ ] `root.css` uses new `@import "tailwindcss"` syntax instead of `@tailwind` directives
- [ ] All existing pages render with identical visual appearance
- [ ] Typography components (H1, H2, P, etc.) maintain styling
- [ ] Custom theme extensions (fonts, shadows) continue to work
- [ ] Build process completes without errors
- [ ] All existing tests pass
- [ ] Linting and type checking pass

## Test Plan

### Pre-Migration Testing
1. Take screenshots of all routes (`/`, `/about`, `/styleguide`)
2. Run full test suite: `pnpm test`
3. Verify build works: `pnpm build`
4. Run linting: `pnpm lint`
5. Run type checking: `pnpm typecheck`

### Migration Steps
1. **Dependency Update**
   - Update `package.json` to use Tailwind CSS v4.x
   - Run `pnpm install` to update lockfile
   - Verify no peer dependency conflicts

2. **Configuration Migration** 
   - Use official migration tool: `npx @tailwindcss/upgrade@next`
   - OR manually migrate `tailwind.config.ts` to CSS-first configuration
   - Update `root.css` to use `@import "tailwindcss"` syntax

3. **Build Verification**
   - Run `pnpm dev` and verify development server starts
   - Test hot reloading with style changes
   - Run `pnpm build` to verify production build

### Post-Migration Testing
1. Visual regression testing - compare screenshots with pre-migration
2. Component testing - verify all typography components render correctly
3. Route testing - test all routes for visual consistency
4. Build testing - ensure production build works
5. Test suite - run `pnpm test` to verify no regressions
6. Linting/type checking - run `pnpm lint` and `pnpm typecheck`

### Rollback Testing
- Verify git rollback restores previous working state
- Test that reverting changes restores v3 functionality

## Risks

### High Risk
- **Breaking visual changes**: Tailwind v4 has utility renames and default value changes that could affect appearance
- **Build failures**: v4 requires Node.js 20+ and modern browsers, may break existing build pipeline
- **Configuration compatibility**: Custom theme extensions may not work with v4's CSS variable approach

### Medium Risk  
- **PostCSS compatibility**: May need to update PostCSS configuration or plugins
- **Development workflow**: Hot reloading and dev server behavior may change
- **Prettier integration**: Tailwind prettier plugin may need updates for v4

### Low Risk
- **Test failures**: Existing component tests should continue working
- **Dependency conflicts**: Well-maintained project should have minimal conflicts

## Rollback Plan

### Immediate Rollback
1. **Git revert**: `git checkout HEAD~1` to previous working commit
2. **Dependency restoration**: `pnpm install` to restore v3 lockfile  
3. **Verification**: Run `pnpm dev` to confirm rollback successful

### Staged Rollback (if migration partially complete)
1. Revert `package.json` to Tailwind CSS v3.4.18
2. Restore original `tailwind.config.ts` 
3. Restore original `root.css` with `@tailwind` directives
4. Run `pnpm install` to downgrade dependencies
5. Test that build and dev server work correctly

### Rollback Testing
- Verify all routes render correctly after rollback
- Run full test suite to ensure no lingering issues
- Confirm build process works in both dev and production modes

## CI Updates

### Required Updates
- **Node.js version**: Ensure CI uses Node.js 20+ (Tailwind v4 requirement)
- **Build verification**: Update CI to test both dev and production builds
- **Browser testing**: Update browser matrix to match v4 supported browsers (Safari 16.4+, Chrome 111+, Firefox 128+)

### CI Pipeline Changes
- Add step to verify Tailwind config validity
- Include visual regression testing if possible
- Test build artifacts for expected CSS output
- Verify no unused/purged utility issues

## Docs Updates

### Architecture Documentation
- Update [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) line 5 and 12 to reference Tailwind CSS v4
- Add note about CSS-first configuration approach
- Update browser compatibility requirements

### ADR Creation  
- Create `docs/ADR/0002-tailwind-v4-migration.md` documenting:
  - Decision to upgrade to Tailwind v4
  - Rationale for CSS-first configuration
  - Impact on build process and browser support
  - Migration approach and risks considered

### README Updates
- Update `web/README.md` to reference Tailwind v4 
- Update setup instructions if configuration approach changes
- Add any new browser compatibility requirements

### Reference Links
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - Frontend architecture overview
- [docs/ADR/README.md](../../docs/ADR/README.md) - Decision record index
- [docs/CODEBASE_OVERVIEW.md](../../docs/CODEBASE_OVERVIEW.md) - Project structure guide