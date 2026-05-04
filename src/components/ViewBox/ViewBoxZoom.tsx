import { useEffect, useRef, ReactNode } from 'react';
import { useZoomImageWheel } from '@zoom-image/react';

interface IProps {
  className?: string;
  children: ReactNode;
}

export function ViewBoxZoom({ className = '', children }: IProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { createZoomImage } = useZoomImageWheel();

  useEffect(() => {
    if (!containerRef.current) return;
    createZoomImage(containerRef.current, {
      wheelZoomRatio: 0.3,
    });
    return () => {};
  }, [createZoomImage]);

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full items-center justify-center overflow-clip rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default ViewBoxZoom;
