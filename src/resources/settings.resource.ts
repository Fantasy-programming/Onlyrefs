import service from '@/services/settings.service';
import { AppSettings } from '@/lib/types';

let _settings: AppSettings | null = null;

export const loadSettings = async () => {
  try {
    _settings = await service.getSettings();
    return _settings;
  } catch (e) {
    console.error('Failed to load settings', e);
    return null;
  }
};

export const getSettings = () => _settings;

export const showInfo = async () => {
  if (!_settings) await loadSettings();
  if (!_settings) return null;
  _settings = {
    ..._settings,
    appearance: { ..._settings.appearance, show_media_info: !_settings.appearance.show_media_info },
  };
  // Note: service does not currently expose a saveSettings function; change is kept in-memory.
  return _settings;
};

export const autoPlayVideo = async () => {
  if (!_settings) await loadSettings();
  if (!_settings) return null;
  _settings = {
    ..._settings,
    appearance: { ..._settings.appearance, video_ref_autoplay: !_settings.appearance.video_ref_autoplay },
  };
  return _settings;
};
