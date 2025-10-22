# QA Checklist: Styleguide and Typography Components

## Font Integration
- [ ] Urbanist font loads correctly via Google Fonts CDN
- [ ] Light (300) and ExtraBold (800) weights are available
- [ ] Font family is properly configured in Tailwind configuration

## Typography Components
- [ ] H1 component renders with ExtraBold weight and proper styling
- [ ] H2 component renders with ExtraBold weight and proper styling
- [ ] P component renders with Light weight and proper spacing
- [ ] UL component renders with Light weight and list styling
- [ ] OL component renders with Light weight and numbered list styling
- [ ] LI component renders with Light weight
- [ ] All components accept `children` and `class` props correctly
- [ ] Components have balanced vertical spacing

## Styleguide Page
- [ ] `/styleguide` route is accessible and loads without errors
- [ ] Page displays all typography components with sample content
- [ ] Content is centered with readable line lengths (max-w-2xl)
- [ ] Page follows existing dark theme styling
- [ ] Typography hierarchy is clear and consistent
- [ ] Example code blocks are properly styled

## Navigation
- [ ] Styleguide link appears in main app header
- [ ] Navigation link has proper styling and hover states
- [ ] Active state styling works correctly when on styleguide page

## Integration & Build
- [ ] No TypeScript errors in any components
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm build` completes successfully
- [ ] No console errors when navigating to styleguide page

## Browser Compatibility
- [ ] Font renders correctly in Chrome
- [ ] Font renders correctly in Firefox
- [ ] Font renders correctly in Safari
- [ ] Page is responsive on mobile devices
- [ ] Typography spacing works across different screen sizes

## Performance
- [ ] Google Fonts load with display=swap parameter
- [ ] Page loads quickly without font loading delays
- [ ] No layout shift when fonts load