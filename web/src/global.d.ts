/// <reference types="@solidjs/start/env" />

declare module "@mdx-js/rollup";

declare module "solid-mdx" {
  import { Component, JSX } from "solid-js";
  
  export interface MDXProviderProps {
    components?: Record<string, Component<any>>;
    children?: JSX.Element;
  }
  
  export const MDXProvider: Component<MDXProviderProps>;
}

declare module "*.mdx" {
  import { Component } from "solid-js";
  const MDXComponent: Component;
  export default MDXComponent;
}
