import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RiArrowsArrowGoBackLine } from 'solid-icons/ri';
import {
  getSettings,
  showInfo,
  autoPlayVideo,
} from '@/resources/settings.resource';

const Settings = () => {
  const settings = getSettings();

  return (
    <motion.div className="flex h-full flex-col py-10 pe-10 ps-4 md:p-10">
      <div className="container flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <a href="/">
            <Button className="size-10 shrink-0" size="icon">
              <RiArrowsArrowGoBackLine className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </a>
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-col items-start gap-2 md:flex-row md:items-center">
              <div className="text-3xl font-semibold uppercase">Appearance</div>
              <div className="text-md text-gray-500 dark:text-gray-400">
                Customize the appearance
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="dark-mode">Show Media Info</Label>
                <Switch
                  checked={settings?.appearance.show_media_info}
                  id="dark-mode"
                  onChange={() => showInfo()}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="autoplay-video">Autoplay Video Ref</Label>
                <Switch
                  id="autoplay-video"
                  checked={settings?.appearance.video_ref_autoplay}
                  onChange={() => autoPlayVideo()}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-col items-start gap-2 md:flex-row md:items-center">
              <div className="text-3xl font-semibold uppercase">Behavior</div>
              <div className="text-md text-gray-500 dark:text-gray-400">
                Manage the behavior of the app
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="sort-by">Sort items by</Label>
                <Select
                  id="sort-by"
                  options={['Creation_Time', 'Last_Modified']}
                  placeholder="Sort By ..."
                  value={settings?.behavior.sort_by}
                >
                  <SelectTrigger
                    aria-label="select notifications"
                    className="w-[180px]"
                  >
                    <SelectValue>
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
    </motion.div>
  );
};

export default Settings;
