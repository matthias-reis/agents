import { Component, JSX } from "solid-js";

interface ULProps {
  children: JSX.Element;
  class?: string;
}

export const UL: Component<ULProps> = (props) => {
  return (
    <ul class={`font-urbanist font-light text-base leading-relaxed mb-4 list-disc list-outside pl-6 space-y-1 ${props.class || ""}`}>
      {props.children}
    </ul>
  );
};