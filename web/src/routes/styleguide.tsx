import { Title } from "@solidjs/meta";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";

export default function StyleGuide() {
  return (
    <>
      <Title>Styleguide - Agents Web</Title>
      <div class="max-w-2xl mx-auto px-6">
        <H1>Typography Styleguide</H1>
        
        <P>
          This styleguide showcases the typography components built with the Urbanist font family. 
          These components provide consistent styling across the application and maintain optimal 
          readability with balanced vertical spacing.
        </P>

        <H2>Headings</H2>
        
        <P>
          Headlines use the ExtraBold weight (800) of Urbanist for strong visual hierarchy and impact.
        </P>

        <div class="mb-8 p-6 bg-slate-900/50 rounded-lg border border-slate-800">
          <H1>This is an H1 Heading</H1>
          <H2>This is an H2 Heading</H2>
        </div>

        <H2>Paragraphs</H2>
        
        <P>
          Paragraph text uses the Light weight (300) of Urbanist for excellent readability. 
          The font provides a clean, modern appearance while maintaining excellent legibility 
          across different screen sizes and resolutions.
        </P>

        <P>
          Multiple paragraphs demonstrate the balanced vertical spacing that creates a 
          comfortable reading experience. The line height and margins work together to 
          guide the reader's eye naturally through the content.
        </P>

        <H2>Lists</H2>

        <P>
          Both unordered and ordered lists use the Light weight for consistency with body text, 
          featuring appropriate spacing and visual indicators.
        </P>

        <H2 class="mb-2">Unordered List</H2>
        <UL>
          <LI>First item in an unordered list</LI>
          <LI>Second item with more content to demonstrate line wrapping and spacing</LI>
          <LI>Third item</LI>
          <LI>Fourth item to show consistent spacing</LI>
        </UL>

        <H2 class="mb-2">Ordered List</H2>
        <OL>
          <LI>First numbered item</LI>
          <LI>Second numbered item with additional content to show how longer text wraps within list items</LI>
          <LI>Third numbered item</LI>
          <LI>Fourth numbered item</LI>
        </OL>

        <H2>Font Weights</H2>
        
        <P>
          The typography system uses two primary weights from the Urbanist font family:
        </P>

        <UL>
          <LI><strong class="font-urbanist font-extrabold">ExtraBold (800)</strong> - Used for headlines (H1, H2)</LI>
          <LI><span class="font-urbanist font-light">Light (300)</span> - Used for body text and lists</LI>
        </UL>

        <H2>Component Features</H2>
        
        <P>
          All typography components accept standard props including:
        </P>

        <UL>
          <LI><code class="px-2 py-1 bg-slate-800 rounded text-sky-300 font-mono text-sm">children</code> - Content to display</LI>
          <LI><code class="px-2 py-1 bg-slate-800 rounded text-sky-300 font-mono text-sm">class</code> - Additional CSS classes for customization</LI>
        </UL>

        <P>
          This allows for flexible styling while maintaining consistency across the design system.
        </P>
      </div>
    </>
  );
}