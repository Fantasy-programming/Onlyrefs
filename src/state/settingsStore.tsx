import { debug, error } from 'tauri-plugin-log-api';
import { onMount, createContext, ParentComponent, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { invoke } from '@tauri-apps/api';
import { AppSettings } from '~/lib/types';

export interface SettingRootState {
  readonly settings: AppSettings;
}

const Context = createContext<SettingRootState>();

export const SettingsProvider: ParentComponent = (props) => {
  const [settings, setSettings] = createStore<AppSettings>({} as AppSettings);

  onMount(async () => {
    try {
      let data: AppSettings = await invoke('get_settings');
      debug('Debug: Settings fetched');
      setSettings(data);
    } catch (e) {
      error('Error: Failed to fetch settings at SettingProvider');
      throw new Error('Failed to fetch settings at SettingProvider');
    }
  });

  const settingsState = {
    get settings() {
      return settings;
    },
  };

  return (
    <Context.Provider value={settingsState}>{props.children}</Context.Provider>
  );
};

export const useSettingsSelector = () => {
  const settingsSelector = useContext(Context);
  if (!settingsSelector) {
    error('Error: useSettingsSelector should be called inside SettingsContext');
    throw new Error(
      'useSettingsSelector should be called inside SettingsContext',
    );
  }
  return settingsSelector;
};
