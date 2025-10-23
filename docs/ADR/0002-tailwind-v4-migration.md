# ADR-0002: Tailwind CSS v4 Migration

## Status

Accepted

## Context

The project was using Tailwind CSS v3.4.18, which is outdated compared to the latest stable version. Tailwind CSS v4 introduces significant improvements including:

- **Performance**: 3.5x faster builds on average
- **Modern CSS Features**: Native CSS variables, `@property` support, color-mix() functions
- **CSS-First Configuration**: Simplified configuration using `@theme` directive instead of JavaScript config
- **Browser Compatibility**: Targets modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+)
- **Build Tool Integration**: Native Vite plugin and improved PostCSS integration

The existing v3.4.18 dependency was becoming a technical debt that could impact future development velocity and modern browser feature adoption.

## Decision

We will migrate from Tailwind CSS v3.4.18 to v4.1.15 (latest stable) using the following approach:

### Configuration Strategy
- **Remove** JavaScript configuration file (`tailwind.config.ts`)
- **Adopt** CSS-first configuration using `@theme` directive in `root.css`
- **Migrate** custom theme extensions (fonts, shadows) to CSS variables
- **Update** PostCSS configuration to use `@tailwindcss/postcss` plugin

### Migration Approach
- Update dependency in `package.json` to `tailwindcss: ^4.1.15`
- Add required `@tailwindcss/postcss` package for PostCSS integration
- Replace `@tailwind` directives with `@import "tailwindcss"`
- Convert theme customizations to CSS variables in `@theme` block
- Create custom utilities as needed for font families

### Backward Compatibility
- Maintain visual consistency across all components and routes
- Preserve existing utility class usage patterns
- Keep custom typography components functional without changes

## Consequences

### Positive
- **Faster builds**: Development and production builds are significantly faster
- **Modern CSS**: Access to latest CSS features like native color-mix() and CSS variables
- **Simplified config**: CSS-first approach is more intuitive and maintainable
- **Better performance**: Optimized CSS output with improved tree-shaking
- **Future-ready**: Aligned with modern web standards and browser capabilities

### Negative
- **Browser support**: Requires modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+)
- **Migration effort**: One-time cost to update configuration and verify compatibility
- **Learning curve**: Team needs to adapt to CSS-first configuration approach
- **Preprocessor incompatibility**: Cannot use Sass/Less with v4 (not applicable to this project)

### Neutral
- **Visual consistency**: No changes to existing UI/UX - migration is transparent to users
- **Component architecture**: Existing component patterns and utility usage remain unchanged
- **Test coverage**: All existing tests continue to pass without modification

## Implementation Notes

### Files Modified
- `web/package.json`: Updated tailwindcss to v4.1.15, added @tailwindcss/postcss
- `web/src/root.css`: Replaced @tailwind directives, added @theme configuration
- `web/postcss.config.cjs`: Updated to use @tailwindcss/postcss plugin
- `web/tailwind.config.ts`: Removed (functionality moved to CSS)

### Theme Customizations Preserved
- Custom font families: Inter (sans) and Urbanist (typography components)
- Custom shadow: `glow` shadow for interactive elements
- All existing color palette and spacing configurations

### Verification
- Build process: Both development and production builds work correctly
- Visual regression: All routes render identically to pre-migration
- Test suite: All existing tests pass without modification
- Linting: No ESLint or TypeScript errors introduced

## References

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Migration Discussion Thread](https://github.com/tailwindlabs/tailwindcss/discussions/16642)
- [Architecture Documentation](../ARCHITECTURE.md)