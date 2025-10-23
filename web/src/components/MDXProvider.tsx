import { MDXProvider } from "solid-mdx";
import { ParentComponent } from "solid-js";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";

const components = {
  h1: H1,
  h2: H2,
  h3: H2, // Map h3 to H2 for now since we don't have H3
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
};

export const MDXProviderWrapper: ParentComponent = (props) => {
  return <MDXProvider components={components}>{props.children}</MDXProvider>;
};