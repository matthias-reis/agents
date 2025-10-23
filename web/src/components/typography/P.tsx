import { Component, JSX } from "solid-js";

interface PProps {
  children: JSX.Element;
  class?: string;
}

export const P: Component<PProps> = (props) => {
  return (
    <p class={`font-urbanist font-light text-base leading-relaxed mb-4 ${props.class || ""}`}>
      {props.children}
    </p>
  );
};