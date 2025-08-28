import React from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { RiCloseLine } from 'react-icons/ri';
import { VscChromeMinimize, VscChromeMaximize } from 'react-icons/vsc';
const appWindow = getCurrentWebviewWindow();

export interface WindowProps extends React.HTMLAttributes<HTMLDivElement> { }

export const WindowDecoration: React.FC<WindowProps> = ({ className, ...rest }) => {
  return (
    <div data-tauri-drag-region className={` fixed left-0 top-0 z-[99999] flex h-7 w-full select-none justify-end p-2 ${className || ''}`} {...rest}>
      <div>
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10" id="titlebar-minimize" onClick={() => appWindow.minimize()}>
          <VscChromeMinimize className="h-1/2 w-1/2" />
        </div>
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground/10" id="titlebar-maximize" onClick={() => appWindow.toggleMaximize()}>
          <VscChromeMaximize className="h-1/2 w-1/2" />
        </div>
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-destructive hover:text-white" id="titlebar-close" onClick={() => appWindow.close()}>
          <RiCloseLine className="h-1/2 w-1/2" />
        </div>
      </div>
    </div>
  );
};
