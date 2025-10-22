import { Component, JSX } from "solid-js";

interface H2Props {
  children: JSX.Element;
  class?: string;
}

export const H2: Component<H2Props> = (props) => {
  return (
    <h2 class={`font-urbanist font-extrabold text-2xl leading-snug mb-4 ${props.class || ""}`}>
      {props.children}
    </h2>
  );
};