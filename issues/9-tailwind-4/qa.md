# QA Checklist: Tailwind 4 Migration

## Manual Testing Plan

Follow these steps in order to verify the Tailwind v4 migration is working correctly:

### 1. Development Server Testing
- [ ] Run `pnpm dev` in the web directory
- [ ] Verify server starts without errors on http://localhost:3000
- [ ] Check browser console for any CSS or JavaScript errors

### 2. Visual Consistency Testing

#### Homepage (/)
- [ ] Navigate to http://localhost:3000
- [ ] Verify the main heading uses Urbanist font (bold/extrabold weight)
- [ ] Check that the counter button has proper styling and hover effects
- [ ] Confirm background is dark slate (slate-950) with light text

#### About Page (/about)
- [ ] Navigate to http://localhost:3000/about
- [ ] Verify page renders correctly with consistent styling
- [ ] Check typography components match expected design

#### Styleguide Page (/styleguide)
- [ ] Navigate to http://localhost:3000/styleguide
- [ ] Verify all typography components render correctly:
  - [ ] H1 and H2 headings use Urbanist font with extrabold weight
  - [ ] Paragraph text uses Urbanist font with light weight
  - [ ] Lists (ordered and unordered) display properly
  - [ ] Font weight examples show correct weights (Light 300, ExtraBold 800)
- [ ] Check custom shadow effects (glow shadow if present)
- [ ] Verify color palette displays correctly

### 3. Interactive Elements Testing
- [ ] Test counter increment/decrement functionality
- [ ] Verify hover effects on interactive elements
- [ ] Check focus states on focusable elements
- [ ] Test responsive behavior by resizing browser window

### 4. Typography Verification
- [ ] Inspect elements to confirm Urbanist font is loading
- [ ] Verify Inter font is used for default sans-serif elements
- [ ] Check that font weights display correctly (300 light, 800 extrabold)

### 5. Build Verification
- [ ] Run `pnpm build` and verify it completes without errors
- [ ] Check that generated CSS includes Urbanist font imports
- [ ] Verify custom theme variables are present in output CSS
- [ ] Confirm no missing or broken utility classes

### 6. Performance Check
- [ ] Compare build times before/after migration (should be faster)
- [ ] Check CSS bundle size in build output
- [ ] Verify no console warnings about missing styles

## Expected Results

### Typography
- Headlines (H1, H2): Urbanist font, extrabold weight (800)
- Body text, lists: Urbanist font, light weight (300)  
- Default text: Inter font for fallback elements

### Colors
- Background: Dark slate (slate-950)
- Text: Light slate (slate-100)
- Links: Sky blue (sky-300) with hover effects
- Accent colors: Various sky and slate shades

### Layout & Spacing
- All components maintain proper spacing and layout
- Responsive design works correctly across screen sizes
- Custom shadows and borders render as expected

## Troubleshooting

If any issues are found:

1. **Font loading issues**: Check network tab for font requests
2. **Missing styles**: Verify `@import "tailwindcss"` in root.css
3. **Build errors**: Check PostCSS configuration and dependencies
4. **Visual regressions**: Compare with pre-migration screenshots/behavior

## Browser Compatibility

Test in modern browsers (Tailwind v4 requirement):
- [ ] Chrome 111+
- [ ] Safari 16.4+
- [ ] Firefox 128+

Note: Tailwind v4 requires modern browsers and will not work in older versions.