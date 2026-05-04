import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';

export function useUpdatePoll() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUp() {
      try {
        const update = await check();
        if (mounted) setUpdateAvailable(update != null);
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }

    checkUp();

    const intervalId = setInterval(checkUp, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return updateAvailable;
}
