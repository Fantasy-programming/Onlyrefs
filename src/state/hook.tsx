import { Accessor, onMount } from "solid-js";
import { createSignal } from "solid-js";

export type IGridSize = [
  gridSize: Accessor<number>,
  updateGridSize: (size: number) => void,
];

export const gridSizeHook = (): IGridSize => {
  const [gridSize, setGridSize] = createSignal(4);

  onMount(() => {
    const gridSize = localStorage.getItem("gridSize");

    if (!gridSize) {
      return;
    }

    setGridSize(Number(gridSize));
  });

  const updateGridSize = (size: number) => {
    setGridSize(size);
    console.log("new size", size);
    localStorage.setItem("gridSize", size.toString());
  };

  return [gridSize, updateGridSize];
};
