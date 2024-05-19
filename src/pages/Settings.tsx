import { Motion } from 'solid-motionone';
import { Card, CardHeader, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { RiArrowsArrowGoBackLine } from 'solid-icons/ri';
import { useSettingsSelector } from '~/state/settingsStore';

const Settings = () => {
  const { settings, showInfo, autoPlayVideo } = useSettingsSelector();

  return (
    <Motion.div class="flex h-full flex-col py-10 pe-10 ps-4 md:p-10">
      <div class="container flex flex-col gap-4">
        <div class="flex items-center gap-4">
          <a href="/">
            <Button class="size-10 shrink-0" size="icon" variant="primary">
              <RiArrowsArrowGoBackLine class="h-4 w-4" />
              <span class="sr-only">Back</span>
            </Button>
          </a>
          <h1 class="text-3xl font-semibold">Settings</h1>
        </div>
        <div class="grid gap-4">
          <Card>
            <CardHeader class="flex flex-col items-start gap-2 md:flex-row md:items-center">
              <div class="text-3xl font-semibold uppercase">Appearance</div>
              <div class="text-md text-gray-500 dark:text-gray-400">
                Customize the appearance
              </div>
            </CardHeader>
            <CardContent class="grid gap-4">
              <div class="flex items-center gap-4">
                <Label for="dark-mode">Show Media Info</Label>
                <Switch
                  checked={settings.appearance.show_media_info}
                  id="dark-mode"
                  onChange={() => showInfo()}
                />
              </div>
              <div class="flex items-center gap-4">
                <Label for="autoplay-video">Autoplay Video Ref</Label>
                <Switch
                  id="autoplay-video"
                  checked={settings.appearance.video_ref_autoplay}
                  onChange={() => autoPlayVideo()}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex flex-col items-start gap-2 md:flex-row md:items-center">
              <div class="text-3xl font-semibold uppercase">Behavior</div>
              <div class="text-md text-gray-500 dark:text-gray-400">
                Manage the behavior of the app
              </div>
            </CardHeader>
            <CardContent class="grid gap-4">
              <div class="flex items-center gap-4">
                <Label for="sort-by">Sort items by</Label>
                <Select
                  id="sort-by"
                  options={['Creation_Time', 'Last_Modified']}
                  placeholder="Sort By ..."
                  value={settings.behavior.sort_by}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {props.item.rawValue}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger
                    aria-label="select notifications"
                    class="w-[180px]"
                  >
                    <SelectValue<string>>
                      {(state) => state.selectedOption()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Motion.div>
  );
};

export default Settings;
