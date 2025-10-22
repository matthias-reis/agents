import { Component, JSX } from "solid-js";

interface H1Props {
  children: JSX.Element;
  class?: string;
}

export const H1: Component<H1Props> = (props) => {
  return (
    <h1 class={`font-urbanist font-extrabold text-4xl leading-tight mb-6 ${props.class || ""}`}>
      {props.children}
    </h1>
  );
};