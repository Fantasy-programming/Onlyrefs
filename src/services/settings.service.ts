import { AppSettings } from '~/lib/types';
import { invoke } from '@tauri-apps/api';

const getSettings = async (): Promise<AppSettings> => {
  try {
    const settings: AppSettings = await invoke('get_settings');
    return settings;
  } catch (error) {
    throw new Error('Failed to fetch settings at SettingProvider');
  }
};

export default { getSettings };
