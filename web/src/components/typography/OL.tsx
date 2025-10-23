import { Component, JSX } from "solid-js";

interface OLProps {
  children: JSX.Element;
  class?: string;
}

export const OL: Component<OLProps> = (props) => {
  return (
    <ol class={`font-urbanist font-light text-base leading-relaxed mb-4 list-decimal list-inside space-y-1 ${props.class || ""}`}>
      {props.children}
    </ol>
  );
};