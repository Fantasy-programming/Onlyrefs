import { createSignal, onCleanup } from 'solid-js';
import { checkUpdate } from '@tauri-apps/api/updater';

export function useUpdatePoll() {
  const [updateAvailable, setUpdateAvailable] = createSignal(false);

  async function checkUp() {
    try {
      const { shouldUpdate } = await checkUpdate();
      setUpdateAvailable(shouldUpdate);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  checkUp();

  const intervalId = setInterval(checkUpdate, 30 * 60 * 1000); // 30 minutes

  onCleanup(() => clearInterval(intervalId));

  return updateAvailable;
}
