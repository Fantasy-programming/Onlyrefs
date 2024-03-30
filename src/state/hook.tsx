import { Accessor, onMount, createRoot, createSignal } from 'solid-js';

export type IGridSize = [
  gridSize: Accessor<number>,
  updateGridSize: (size: number) => void,
];

export const gridSizeHook = createRoot(() => {
  const [gridSize, setGridSize] = createSignal(4);

  onMount(() => {
    const gridSize = localStorage.getItem('gridSize');
    if (!gridSize) {
      return;
    }
    setGridSize(Number(gridSize));
  });

  const updateGridSize = (size: number) => {
    setGridSize(size);
    localStorage.setItem('gridSize', size.toString());
  };

  return [gridSize, updateGridSize] as IGridSize;
});
