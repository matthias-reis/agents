import { Component, JSX } from "solid-js";

interface LIProps {
  children: JSX.Element;
  class?: string;
}

export const LI: Component<LIProps> = (props) => {
  return (
    <li class={`font-urbanist font-light text-base leading-relaxed ${props.class || ""}`}>
      {props.children}
    </li>
  );
};