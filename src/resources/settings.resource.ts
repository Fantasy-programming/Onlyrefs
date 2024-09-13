import service from '~/services/settings.service';
import { createResource } from 'solid-js';

import { AppSettings } from '~/lib/types';

const [settings, { mutate }] = createResource<AppSettings>(service.getSettings);

export const getSettings = () => {
  return settings;
};

export const showInfo = () => {
  mutate((oldSettings) => {
    if (!oldSettings) return undefined;

    return {
      ...oldSettings,
      appearance: {
        ...oldSettings?.appearance,
        show_media_info: !oldSettings?.appearance.show_media_info,
      },
    };
  });
};

export const autoPlayVideo = () => {
  mutate((oldSettings) => {
    if (!oldSettings) return undefined;

    return {
      ...oldSettings,
      appearance: {
        ...oldSettings?.appearance,
        video_ref_autoplay: !oldSettings?.appearance.video_ref_autoplay,
      },
    };
  });
};
