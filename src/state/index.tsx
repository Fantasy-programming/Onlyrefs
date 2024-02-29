import { onMount } from "solid-js";
import { createSignal } from "solid-js";

export const gridSize = () => {
  const [gridSize, setGridSize] = createSignal(0);

  onMount(() => {
    const gridSize = localStorage.getItem("gridSize");
    if (!gridSize) {
      setGridSize(4);
      return;
    }

    setGridSize(Number(gridSize));
  });

  const updateGridSize = (size: number) => {
    setGridSize(size);
    localStorage.setItem("gridSize", size.toString());
  };

  return { gridSize, updateGridSize };
};
