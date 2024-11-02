import React from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { RiSystemCloseLine } from 'react-icons/ri';
import { VsChromeMinimize, VsChromeMaximize } from 'react-icons/vs';

const appWindow = getCurrentWebviewWindow();

export interface WindowProps extends React.ComponentProps<'div'> {}

const WindowDecoration: React.FC<WindowProps> = ({ className, ...props }) => {
  return (
    <div
      data-tauri-drag-region
      className={`fixed left-0 top-0 z-[99999] flex h-7 w-full select-none justify-end p-2 ${className}`}
      {...props}
    >
      <div>
        <div
          className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10"
          id="titlebar-minimize"
          onClick={() => appWindow.minimize()}
        >
          <VsChromeMinimize className="h-1/2 w-1/2" />
        </div>
        <div
          className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10"
          id="titlebar-maximize"
          onClick={() => appWindow.toggleMaximize()}
        >
          <VsChromeMaximize className="h-1/2 w-1/2" />
        </div>
        <div
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-destructive hover:text-white"
          id="titlebar-close"
          onClick={() => appWindow.close()}
        >
          <RiSystemCloseLine className="h-1/2 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export default WindowDecoration;
