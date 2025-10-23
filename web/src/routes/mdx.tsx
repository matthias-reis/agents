import { Title } from "@solidjs/meta";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";

export default function MDXPage() {
  return (
    <>
      <Title>MDX Demo - Agents Web</Title>
      <div>
        <H1>Welcome to MDX</H1>
        <P>This is a sample MDX document showcasing the integration of Markdown content with our existing typography components.</P>
        
        <H2>Typography Components</H2>
        <P>MDX allows us to seamlessly blend Markdown syntax with our custom SolidJS components. Here are examples of all supported elements:</P>
        
        <H2>Headings and Text</H2>
        <P>This paragraph demonstrates our custom paragraph component with proper styling and spacing. The typography follows our design system standards.</P>
        <P>Another paragraph to show the consistent spacing and readability provided by our custom typography components.</P>
        
        <H2>Lists</H2>
        <P>Here is an unordered list:</P>
        <UL>
          <LI>First item in the list</LI>
          <LI>Second item with more content</LI>
          <LI>Third item demonstrating consistent styling</LI>
        </UL>
        
        <P>And an ordered list:</P>
        <OL>
          <LI>First numbered item</LI>
          <LI>Second numbered item</LI>
          <LI>Third numbered item</LI>
        </OL>
        
        <H2>Nested Lists</H2>
        <P>Lists can also be nested for more complex content organization:</P>
        <UL>
          <LI>
            Main item one
            <UL>
              <LI>Sub-item A</LI>
              <LI>Sub-item B</LI>
            </UL>
          </LI>
          <LI>
            Main item two
            <OL>
              <LI>Nested numbered item</LI>
              <LI>Another nested numbered item</LI>
            </OL>
          </LI>
        </UL>
        
        <H2>Benefits of MDX</H2>
        <P>Using MDX in our SolidJS application provides several advantages:</P>
        <UL>
          <LI><strong>Content-driven development</strong>: Write content in familiar Markdown syntax</LI>
          <LI><strong>Component integration</strong>: Seamlessly use existing typography components</LI>
          <LI><strong>Consistent styling</strong>: Maintain design system standards across all content</LI>
          <LI><strong>Developer experience</strong>: Fast development with familiar tooling</LI>
        </UL>
        
        <H2>Conclusion</H2>
        <P>This demonstrates the successful integration of MDX with our SolidJS application and typography system.</P>
      </div>
    </>
  );
}