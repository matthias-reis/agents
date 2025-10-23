import { Title } from "@solidjs/meta";
import { createSignal, onMount } from "solid-js";
import { MDXProvider } from "solid-mdx";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "solid-js/jsx-runtime";

const components = {
  h1: H1,
  h2: H2,
  h3: H2, // Map h3 to H2 for now
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
};

export default function MDXPage() {
  const [Content, setContent] = createSignal<any>(null);

  onMount(async () => {
    const mdxSource = `# Welcome to MDX

This is a sample MDX document showcasing the integration of Markdown content with our existing typography components.

## Typography Components

MDX allows us to seamlessly blend Markdown syntax with our custom SolidJS components. Here are examples of all supported elements:

### Headings and Text

This paragraph demonstrates our custom paragraph component with proper styling and spacing. The typography follows our design system standards.

Another paragraph to show the consistent spacing and readability provided by our custom typography components.

### Lists

Here is an unordered list:

- First item in the list
- Second item with more content
- Third item demonstrating consistent styling

And an ordered list:

1. First numbered item
2. Second numbered item  
3. Third numbered item

### Nested Lists

Lists can also be nested for more complex content organization:

- Main item one
  - Sub-item A
  - Sub-item B
- Main item two
  1. Nested numbered item
  2. Another nested numbered item

## Benefits of MDX

Using MDX in our SolidJS application provides several advantages:

- **Content-driven development**: Write content in familiar Markdown syntax
- **Component integration**: Seamlessly use existing typography components
- **Consistent styling**: Maintain design system standards across all content
- **Developer experience**: Fast development with familiar tooling

## Conclusion

This demonstrates the successful integration of MDX with our SolidJS application and typography system.`;

    try {
      const { default: MDXContent } = await evaluate(mdxSource, runtime);
      setContent(() => MDXContent);
    } catch (error) {
      console.error("Error evaluating MDX:", error);
      // Fallback to static content
      setContent(() => () => (
        <div>
          <H1>MDX Loading Error</H1>
          <P>There was an error loading the MDX content. This demonstrates dynamic MDX processing.</P>
        </div>
      ));
    }
  });

  return (
    <>
      <Title>MDX Demo - Agents Web</Title>
      <div>
        <MDXProvider components={components}>
          {Content() && Content()()}
        </MDXProvider>
      </div>
    </>
  );
}