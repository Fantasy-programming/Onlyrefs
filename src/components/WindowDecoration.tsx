import React, { useEffect, useState } from 'react';
import {
  getCurrentWebviewWindow,
  WebviewWindow,
} from '@tauri-apps/api/webviewWindow';
import { RiCloseLine } from 'react-icons/ri';
import { VscChromeMinimize, VscChromeMaximize } from 'react-icons/vsc';

export interface WindowProps extends React.HTMLAttributes<HTMLDivElement> {}

// macOS traffic light button component
const MacTrafficLight: React.FC<{
  color: string;
  hoverColor: string;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}> = ({ color, hoverColor, onClick, icon, title }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="group relative flex h-3 w-3 items-center justify-center rounded-full transition-colors"
      style={{ backgroundColor: isHovered ? hoverColor : color }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
    >
      <span
        className="text-black/60 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ fontSize: '8px', lineHeight: 1 }}
      >
        {icon}
      </span>
    </button>
  );
};

// macOS-style traffic light buttons
const MacTrafficLights: React.FC<{
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}> = ({ onClose, onMinimize, onMaximize }) => {
  return (
    <div className="flex items-center gap-2">
      <MacTrafficLight
        color="#FF5F57"
        hoverColor="#FF5F57"
        onClick={onClose}
        icon="×"
        title="Close"
      />
      <MacTrafficLight
        color="#FEBC2E"
        hoverColor="#FEBC2E"
        onClick={onMinimize}
        icon="−"
        title="Minimize"
      />
      <MacTrafficLight
        color="#28C840"
        hoverColor="#28C840"
        onClick={onMaximize}
        icon="+"
        title="Maximize"
      />
    </div>
  );
};

// Windows-style buttons
const WindowsButtons: React.FC<{
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}> = ({ onClose, onMinimize, onMaximize }) => {
  return (
    <div className="flex items-center">
      <button
        className="hover:bg-foreground/10 inline-flex h-8 w-11 items-center justify-center transition-colors"
        onClick={onMinimize}
        title="Minimize"
      >
        <VscChromeMinimize className="h-4 w-4" />
      </button>
      <button
        className="hover:bg-foreground/10 inline-flex h-8 w-11 items-center justify-center transition-colors"
        onClick={onMaximize}
        title="Maximize"
      >
        <VscChromeMaximize className="h-4 w-4" />
      </button>
      <button
        className="hover:bg-destructive inline-flex h-8 w-11 items-center justify-center transition-colors hover:text-white"
        onClick={onClose}
        title="Close"
      >
        <RiCloseLine className="h-5 w-5" />
      </button>
    </div>
  );
};

export const WindowDecoration: React.FC<WindowProps> = ({
  className,
  ...rest
}) => {
  const [appWindow, setAppWindow] = useState<WebviewWindow | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      setAppWindow(getCurrentWebviewWindow());
      // Detect platform using navigator
      const userAgent = navigator.userAgent.toLowerCase();
      const platformStr = navigator.platform.toLowerCase();
      setIsMac(
        platformStr.includes('mac') ||
          userAgent.includes('mac') ||
          userAgent.includes('darwin'),
      );
      setIsReady(true);
    };
    init();
  }, []);

  const handleClose = () => appWindow?.close();
  const handleMinimize = () => appWindow?.minimize();
  const handleMaximize = () => appWindow?.toggleMaximize();

  // Don't render until we know the platform
  if (!isReady) return null;

  return (
    <div
      className={`pointer-events-none fixed top-0 right-0 left-0 z-[99999] flex h-8 items-center select-none ${
        isMac ? 'justify-start pl-3' : 'justify-end'
      } ${className || ''}`}
      {...rest}
    >
      {/* Drag region - allows window dragging but clicks pass through */}
      <div data-tauri-drag-region className="absolute inset-0" />
      {/* Control buttons - fully clickable */}
      <div className="pointer-events-auto relative">
        {isMac ? (
          <MacTrafficLights
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
          />
        ) : (
          <WindowsButtons
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
          />
        )}
      </div>
    </div>
  );
};
