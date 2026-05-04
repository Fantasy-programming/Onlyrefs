import { AppSettings } from '@/lib/types';
import { invoke } from '@tauri-apps/api/core';

const getSettings = async (): Promise<AppSettings> => {
  try {
    const settings: AppSettings = await invoke('get_settings');
    return settings;
  } catch (error) {
    throw new Error('Failed to fetch settings at SettingProvider');
  }
};

const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await invoke('save_settings', { settings });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
};

export default { getSettings, saveSettings };
