import React from 'react';
import {
  RiLayoutMasonryLine,
  RiLayoutGridLine,
  RiListCheck,
  RiLayoutRowLine,
  RiSortAsc,
  RiSortDesc,
} from 'react-icons/ri';
import { LuSettings2 } from 'react-icons/lu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { LayoutMode } from './TopBar';
import { SortBy, ViewSettings } from '@/state/hook';

// Layout mode options
const LAYOUT_MODES: {
  value: LayoutMode;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}[] = [
  {
    value: 'masonry',
    icon: <RiLayoutMasonryLine className="h-4 w-4" />,
    label: 'Masonry',
    shortcut: 'Ctrl+1',
  },
  {
    value: 'justified',
    icon: <RiLayoutRowLine className="h-4 w-4" />,
    label: 'Justified',
    shortcut: 'Ctrl+2',
  },
  {
    value: 'grid',
    icon: <RiLayoutGridLine className="h-4 w-4" />,
    label: 'Grid',
    shortcut: 'Ctrl+3',
  },
  {
    value: 'list',
    icon: <RiListCheck className="h-4 w-4" />,
    label: 'List',
    shortcut: 'Ctrl+4',
  },
];

// Sort options
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'date_added', label: 'Date Added' },
  { value: 'date_modified', label: 'Date Modified' },
  { value: 'date_created', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'extension', label: 'Extension' },
  { value: 'file_size', label: 'File Size' },
  { value: 'dimensions', label: 'Dimensions' },
  { value: 'rating', label: 'Rating' },
  { value: 'random', label: 'Random' },
];

interface ViewSettingsPopoverProps {
  // Layout
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  // Sort
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  // View settings
  viewSettings: ViewSettings;
  onViewSettingsChange: (settings: Partial<ViewSettings>) => void;
  // Panel toggles
  isSidebarVisible: boolean;
  onSidebarToggle: () => void;
  isInspectorVisible: boolean;
  onInspectorToggle: () => void;
}

export const ViewSettingsPopover: React.FC<ViewSettingsPopoverProps> = ({
  layoutMode,
  onLayoutModeChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  viewSettings,
  onViewSettingsChange,
  isSidebarVisible,
  onSidebarToggle,
  isInspectorVisible,
  onInspectorToggle,
}) => {
  const currentLayout = LAYOUT_MODES.find((m) => m.value === layoutMode);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
              {currentLayout?.icon}
              <span className="text-xs capitalize">{currentLayout?.label}</span>
              <LuSettings2 className="ml-0.5 h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>View settings</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Layout Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Layout</Label>
              <Select
                value={layoutMode}
                onValueChange={(v) => onLayoutModeChange(v as LayoutMode)}
              >
                <SelectTrigger size="sm" className="h-7 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_MODES.map((mode) => (
                    <SelectItem
                      key={mode.value}
                      value={mode.value}
                      className="text-xs"
                    >
                      <span className="flex items-center gap-2">
                        {mode.icon}
                        {mode.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Sort by</Label>
              <div className="flex items-center gap-1">
                <Select
                  value={sortBy}
                  onValueChange={(v) => onSortByChange(v as SortBy)}
                >
                  <SelectTrigger size="sm" className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onSortDirectionChange(
                      sortDirection === 'asc' ? 'desc' : 'asc',
                    )
                  }
                >
                  {sortDirection === 'asc' ? (
                    <RiSortAsc className="h-4 w-4" />
                  ) : (
                    <RiSortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-border bg-border h-px" />

          {/* View Toggles */}
          <div className="space-y-3">
            <SettingToggle
              label="Show Name"
              checked={viewSettings.showName}
              onCheckedChange={(checked) =>
                onViewSettingsChange({ showName: checked })
              }
            />
            <SettingToggle
              label="Show item info"
              checked={viewSettings.showItemInfo}
              onCheckedChange={(checked) =>
                onViewSettingsChange({ showItemInfo: checked })
              }
            />
            <SettingToggle
              label="Show extension"
              checked={viewSettings.showExtension}
              onCheckedChange={(checked) =>
                onViewSettingsChange({ showExtension: checked })
              }
            />
            <SettingToggle
              label="Show annotation"
              checked={viewSettings.showAnnotation}
              onCheckedChange={(checked) =>
                onViewSettingsChange({ showAnnotation: checked })
              }
            />
            <SettingToggle
              label="Show subfolder contents"
              checked={viewSettings.showSubfolderContents}
              onCheckedChange={(checked) =>
                onViewSettingsChange({ showSubfolderContents: checked })
              }
            />
          </div>

          {/* Divider */}
          <div className="border-border bg-border h-px" />

          {/* Panel Toggles */}
          <div className="space-y-3">
            <SettingToggle
              label="Show sidebar"
              checked={isSidebarVisible}
              onCheckedChange={onSidebarToggle}
              shortcut="Ctrl+["
            />
            <SettingToggle
              label="Show inspector"
              checked={isInspectorVisible}
              onCheckedChange={onInspectorToggle}
              shortcut="Ctrl+]"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper component for toggle items
interface SettingToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  shortcut?: string;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  checked,
  onCheckedChange,
  shortcut,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-sm">{label}</span>
      {shortcut && (
        <span className="text-muted-foreground text-[10px]">{shortcut}</span>
      )}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default ViewSettingsPopover;
