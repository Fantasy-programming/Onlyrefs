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

const Settings = () => {
  return (
    <Motion.div class="flex flex-col">
      <div class="flex-1">
        <div class="container flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <Button class="shrink-0" size="icon" variant="ghost">
              <a href="/">
                <ChevronLeftIcon className="h-4 w-4" />
                <span class="sr-only">Back</span>
              </a>
            </Button>
            <h1 class="text-2xl font-semibold">Settings</h1>
          </div>
          <div class="grid gap-4">
            <Card>
              <CardHeader class="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <div class="text-2xl font-semibold">Appearance</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Customize the appearance
                </div>
              </CardHeader>
              <CardContent class="grid gap-4">
                <div class="flex items-center gap-4">
                  <Label for="dark-mode">Dark mode</Label>
                  <Switch defaultChecked id="dark-mode" />
                </div>
                <div class="flex items-center gap-4">
                  <Label for="compact-mode">Compact mode</Label>
                  <Switch id="compact-mode" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <div class="text-2xl font-semibold">Behavior</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
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
      </div>
      <div class="flex h-16 w-full items-center justify-center">
        <Button class="ml-auto">Save changes</Button>
      </div>
    </Motion.div>
  );
};

function ChevronLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default Settings;
