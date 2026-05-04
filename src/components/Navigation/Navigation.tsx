import React, { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { useUpdatePoll } from './useUpdatePoll';
import { useGridSize } from '../../state/hook';
import { FiSettings, FiSun, FiMoon, FiGrid } from 'react-icons/fi';
import { BsGrid3X3Gap } from 'react-icons/bs';
import { TbGridDots } from 'react-icons/tb';
import Logo from '@/assets/logo-simple.svg?react';
import { RiLoopLeftFill } from 'react-icons/ri';
import * as dialog from '@tauri-apps/plugin-dialog';

export const SideNavigation: React.FC = () => {
  const updateAvailable = useUpdatePoll();
  const [gridPressed, setGridPressed] = useState(false);

  async function handleUpdate() {
    const confirm = await dialog.ask(
      'An update is available. Do you want to update now?',
      {
        title: 'Update Available',
        kind: 'info',
      },
    );

    if (confirm) {
      try {
        const update = await check();
        if (update) {
          await update.downloadAndInstall();
        }
      } catch (error) {
        console.error('Failed to install update:', error);
      }
    }
  }

  return (
    <nav className="fixed top-0 left-0 z-50 hidden h-screen w-10 flex-col items-center justify-end md:flex md:w-20">
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Logo className="h-9 w-9" />
      </div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
        <div className="flex items-center gap-4 text-3xl">
          <span>
            <span className="text-foreground opacity-9">Only</span>
            <span className="text-accent/80 opacity-9">Ref</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 py-12 text-white">
        {updateAvailable && (
          <div className="relative" onClick={handleUpdate}>
            <RiLoopLeftFill className="text-foreground h-5 w-5" />
            <span className="bg-accent absolute top-0 right-0 h-2 w-2 rounded-full" />
          </div>
        )}
        <button
          onClick={() => {}}
          className={gridPressed ? 'pointer-events-none opacity-0' : 'block'}
        >
          {gridPressed ? (
            <FiSun className="text-foreground h-5 w-5" />
          ) : (
            <FiMoon className="text-foreground h-5 w-5" />
          )}
        </button>
        <button onClick={() => setGridPressed((p) => !p)}>
          {gridPressed ? (
            <SizePicker />
          ) : (
            <FiGrid className="text-foreground h-5 w-5" />
          )}
        </button>
        <a
          href="/settings"
          className={gridPressed ? 'pointer-events-none opacity-0' : 'block'}
        >
          <span>
            <FiSettings className="text-foreground h-5 w-5" />
          </span>
        </a>
      </div>
    </nav>
  );
};

const SizePicker: React.FC = () => {
  const [gridSize, updateGridSize] = useGridSize();

  return (
    <div className="bg-foreground flex flex-col space-y-6 rounded-full p-3 transition-all ease-in">
      <div
        className={gridSize === 4 ? '' : 'opacity-50'}
        onClick={() => updateGridSize(4)}
      >
        <FiGrid className="text-background h-5 w-5" />
      </div>
      <div
        className={gridSize === 5 ? '' : 'opacity-50'}
        onClick={() => updateGridSize(5)}
      >
        <BsGrid3X3Gap className="text-background h-5 w-5" />
      </div>
      <div
        className={gridSize === 6 ? '' : 'opacity-50'}
        onClick={() => updateGridSize(6)}
      >
        <TbGridDots className="text-background h-5 w-5" />
      </div>
    </div>
  );
};
