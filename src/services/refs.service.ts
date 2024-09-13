import { getUpdatedAtTimestamp } from '~/lib/helper';
import { NoteRef, Ref } from '~/lib/types';
import { invoke } from '@tauri-apps/api';

const getRefs = async (): Promise<Ref[]> => {
  try {
    const data: Ref[] = await invoke('get_all_refs');

    data.sort((a, b) => {
      const aUpdatedAt = getUpdatedAtTimestamp(a);
      const bUpdatedAt = getUpdatedAtTimestamp(b);
      return bUpdatedAt - aUpdatedAt;
    });

    return data;
  } catch (e) {
    throw new Error('Failed to fetch refs at RefProvider fetchRef');
  }
};

export default { getRefs };
