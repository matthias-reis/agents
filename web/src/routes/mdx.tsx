import { Title } from "@solidjs/meta";
import { MDXProvider } from "solid-mdx";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";
import SampleContent from "~/content/sample.mdx";

const components = {
  h1: H1,
  h2: H2,
  h3: H2, // Using H2 for h3 as we only have H1 and H2 components
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
};

export default function MDXPage() {
  return (
    <>
      <Title>MDX Demo - Agents Web</Title>
      <MDXProvider components={components}>
        <SampleContent />
      </MDXProvider>
    </>
  );
}