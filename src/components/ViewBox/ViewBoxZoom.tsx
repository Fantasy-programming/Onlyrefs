import { JSX, onMount } from 'solid-js';
import { useZoomImageWheel } from '@zoom-image/solid';

interface IProps {
  class?: string;
  children: JSX.Element;
}

export function ViewBoxZoom(props: IProps) {
  let container: HTMLDivElement;
  const { createZoomImage } = useZoomImageWheel();

  onMount(() => {
    createZoomImage(container, {
      wheelZoomRatio: 0.3,
    });
  });

  return (
    <div
      // @ts-ignore
      ref={container}
      class={`flex h-full w-full items-center justify-center overflow-clip rounded-xl ${props.class || ''}`}
    >
      {props.children}
    </div>
  );
}
