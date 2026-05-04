import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiPaintBrushLine,
  RiSettings3Line,
  RiInformationLine,
} from 'react-icons/ri';
import { useSettingsStore } from '@/resources/settings.resource';
import { useSettingsDialog } from './SettingsDialogContext';

type ColorScheme = 'light' | 'dark' | 'system';

export const SettingsDialog: React.FC = () => {
  const { isOpen, closeSettings } = useSettingsDialog();
  const { settings, toggleShowMediaInfo, toggleVideoAutoplay } =
    useSettingsStore();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');

  // Load color scheme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('colorScheme') as ColorScheme;
    if (saved) {
      setColorScheme(saved);
    }
  }, []);

  const applyColorScheme = (scheme: ColorScheme) => {
    const root = document.documentElement;

    if (scheme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', scheme === 'dark');
    }
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem('colorScheme', scheme);
    applyColorScheme(scheme);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Customize your Onlyrefs experience
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <RiPaintBrushLine className="text-primary h-4 w-4" />
              <h2 className="text-sm font-semibold">Appearance</h2>
            </div>

            <Card className="py-0">
              <CardContent className="divide-border/40 divide-y p-0">
                {/* Color Scheme */}
                <div className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Color Scheme</Label>
                    <p className="text-muted-foreground text-xs">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <div className="border-border/40 flex gap-1 rounded-lg border p-1">
                    <button
                      onClick={() => handleColorSchemeChange('light')}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        colorScheme === 'light'
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RiSunLine className="h-3.5 w-3.5" />
                      Light
                    </button>
                    <button
                      onClick={() => handleColorSchemeChange('dark')}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        colorScheme === 'dark'
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RiMoonLine className="h-3.5 w-3.5" />
                      Dark
                    </button>
                    <button
                      onClick={() => handleColorSchemeChange('system')}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        colorScheme === 'system'
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RiComputerLine className="h-3.5 w-3.5" />
                      System
                    </button>
                  </div>
                </div>

                {/* Show Media Info */}
                <div className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Show Media Info
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Display detailed information overlay on media items
                    </p>
                  </div>
                  <Switch
                    checked={settings?.appearance.show_media_info ?? true}
                    onCheckedChange={toggleShowMediaInfo}
                  />
                </div>

                {/* Autoplay Video */}
                <div className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Autoplay Videos
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Automatically play video references on hover
                    </p>
                  </div>
                  <Switch
                    checked={settings?.appearance.video_ref_autoplay ?? false}
                    onCheckedChange={toggleVideoAutoplay}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Behavior Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <RiSettings3Line className="text-primary h-4 w-4" />
              <h2 className="text-sm font-semibold">Behavior</h2>
            </div>

            <Card className="py-0">
              <CardContent className="divide-border/40 divide-y p-0">
                {/* Sort By */}
                <div className="flex items-center justify-between p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Sort Items By</Label>
                    <p className="text-muted-foreground text-xs">
                      Choose how your references are sorted
                    </p>
                  </div>
                  <Select defaultValue="creation">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creation">Creation Time</SelectItem>
                      <SelectItem value="modified">Last Modified</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* About Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <RiInformationLine className="text-primary h-4 w-4" />
              <h2 className="text-sm font-semibold">About</h2>
            </div>

            <Card className="py-0">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Onlyrefs</p>
                    <p className="text-muted-foreground text-xs">
                      All your references in a single place
                    </p>
                  </div>
                  <span className="bg-muted/30 rounded-full px-2.5 py-1 text-xs font-medium">
                    v0.0.6
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Keyboard Shortcut Hint */}
          <div className="text-muted-foreground text-center text-xs">
            Press{' '}
            <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
              ,
            </kbd>{' '}
            to open settings
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
