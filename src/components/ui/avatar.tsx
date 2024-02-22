import type { Component } from "solid-js";
import { splitProps } from "solid-js";

import { Image as ImagePrimitive } from "@kobalte/core";

import { cn } from "../../lib/utils";

const Avatar: Component<ImagePrimitive.ImageRootProps> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive.Root
      class={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        props.class,
      )}
      {...rest}
    />
  );
};

const AvatarImage: Component<ImagePrimitive.ImageImgProps> = (props) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive.Img
      class={cn("aspect-square size-full", props.class)}
      {...rest}
    />
  );
};

const AvatarFallback: Component<ImagePrimitive.ImageFallbackProps> = (
  props,
) => {
  const [, rest] = splitProps(props, ["class"]);
  return (
    <ImagePrimitive.Fallback
      class={cn(
        "flex size-full items-center justify-center rounded-full bg-muted",
        props.class,
      )}
      {...rest}
    />
  );
};

export { Avatar, AvatarImage, AvatarFallback };
