import { useEffect, useState } from 'react';

export const useGridSize = (initial = 4) => {
  const [gridSize, setGridSize] = useState<number>(initial);

  useEffect(() => {
    const g = localStorage.getItem('gridSize');
    if (!g) return;
    setGridSize(Number(g));
  }, []);

  const updateGridSize = (size: number) => {
    console.debug(`Debug: Grid size updated to ${size}`);
    setGridSize(size);
    localStorage.setItem('gridSize', size.toString());
  };

  return [gridSize, updateGridSize] as const;
};
