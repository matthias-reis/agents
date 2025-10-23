import { MDXProvider } from "solid-mdx";
import { ParentComponent, Component, JSX } from "solid-js";
import { H1, H2, P, UL, OL, LI } from "~/components/typography";

// Create wrapper components that accept MDX props
const components: Record<string, Component<{ children?: JSX.Element; [key: string]: unknown }>> = {
  h1: (props) => <H1 children={props.children} />,
  h2: (props) => <H2 children={props.children} />,
  h3: (props) => <H2 children={props.children} />, // Map h3 to H2 for now since we don't have H3
  p: (props) => <P children={props.children} />,
  ul: (props) => <UL children={props.children} />,
  ol: (props) => <OL children={props.children} />,
  li: (props) => <LI children={props.children} />,
};

export const MDXProviderWrapper: ParentComponent = (props) => {
  return <MDXProvider components={components}>{props.children}</MDXProvider>;
};