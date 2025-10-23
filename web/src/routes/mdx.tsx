import { Title } from "@solidjs/meta";
import { MDXProviderWrapper } from "~/components/MDXProvider";
import SampleContent from "~/content/sample.mdx";

export default function MDXPage() {
  return (
    <>
      <Title>MDX Demo - Agents Web</Title>
      <div>
        <MDXProviderWrapper>
          <SampleContent />
        </MDXProviderWrapper>
      </div>
    </>
  );
}