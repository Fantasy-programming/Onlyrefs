import { create } from 'zustand';
import service from '@/services/settings.service';
import { AppSettings } from '@/lib/types';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  toggleShowMediaInfo: () => Promise<void>;
  toggleVideoAutoplay: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  appearance: {
    show_media_info: true,
    video_ref_autoplay: false,
  },
  behavior: {
    sort_by: 0, // CreationTime
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: true,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await service.getSettings();
      set({ settings, isLoading: false });
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({
        settings: defaultSettings,
        isLoading: false,
        error: 'Failed to load settings',
      });
    }
  },

  updateSettings: async (partial) => {
    const { settings } = get();
    if (!settings) return;

    const newSettings: AppSettings = {
      ...settings,
      ...partial,
      appearance: { ...settings.appearance, ...partial.appearance },
      behavior: { ...settings.behavior, ...partial.behavior },
    };

    set({ settings: newSettings });

    try {
      await service.saveSettings(newSettings);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  toggleShowMediaInfo: async () => {
    const { settings, updateSettings } = get();
    if (!settings) return;

    await updateSettings({
      appearance: {
        ...settings.appearance,
        show_media_info: !settings.appearance.show_media_info,
      },
    });
  },

  toggleVideoAutoplay: async () => {
    const { settings, updateSettings } = get();
    if (!settings) return;

    await updateSettings({
      appearance: {
        ...settings.appearance,
        video_ref_autoplay: !settings.appearance.video_ref_autoplay,
      },
    });
  },
}));

// Legacy exports for backwards compatibility
export const loadSettings = () => useSettingsStore.getState().loadSettings();
export const getSettings = () => useSettingsStore.getState().settings;
export const showInfo = () => useSettingsStore.getState().toggleShowMediaInfo();
export const autoPlayVideo = () =>
  useSettingsStore.getState().toggleVideoAutoplay();
