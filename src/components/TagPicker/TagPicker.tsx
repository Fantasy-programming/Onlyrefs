import React, { useState, useMemo } from 'react';
import { Check, Plus, Tag, X } from 'lucide-react';
import { emit } from '@tauri-apps/api/event';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRefStore } from '@/state/refstore';

interface TagPickerProps {
  id: string;
  path: string;
  selectedTags: string[];
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  className?: string;
  triggerClassName?: string;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  id,
  path,
  selectedTags,
  onTagAdd,
  onTagRemove,
  className,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const refs = useRefStore((state) => state.refs);

  // Get all unique tags from all refs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    refs.forEach((ref) => {
      const tags = ref.metadata.tags;
      if (tags) {
        tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [refs]);

  // Filter tags based on input
  const filteredTags = useMemo(() => {
    if (!inputValue) return allTags;
    const search = inputValue.toLowerCase();
    return allTags.filter((tag) => tag.toLowerCase().includes(search));
  }, [allTags, inputValue]);

  // Check if input matches any existing tag exactly
  const exactMatch = allTags.some(
    (tag) => tag.toLowerCase() === inputValue.toLowerCase(),
  );

  const handleSelect = async (tag: string) => {
    const isSelected = selectedTags.includes(tag);

    if (isSelected) {
      // Remove tag
      await emit('tag_removed', { id, tag, path });
      onTagRemove?.(tag);
    } else {
      // Add tag
      await emit('tag_added', { id, tag, path });
      onTagAdd?.(tag);
    }
  };

  const handleCreateTag = async () => {
    const tag = inputValue.trim();
    if (!tag || selectedTags.includes(tag)) return;

    await emit('tag_added', { id, tag, path });
    onTagAdd?.(tag);
    setInputValue('');
  };

  const handleRemoveTag = async (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await emit('tag_removed', { id, tag, path });
    onTagRemove?.(tag);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Display selected tags */}
      <div className="flex flex-wrap gap-1">
        {[...new Set(selectedTags)].map((tag) => (
          <span
            key={tag}
            className="group bg-primary/10 text-primary inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]"
          >
            #{tag}
            <button
              onClick={(e) => handleRemoveTag(tag, e)}
              className="hover:bg-primary/20 ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {/* Add tag button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary inline-flex items-center gap-0.5 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] transition-colors',
                triggerClassName,
              )}
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search or create tag..."
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                {/* Create new tag option */}
                {inputValue && !exactMatch && (
                  <>
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateTag}
                        className="text-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create "{inputValue}"
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* Existing tags */}
                <CommandGroup
                  heading={inputValue ? 'Matching tags' : 'All tags'}
                >
                  {filteredTags.length === 0 && !inputValue ? (
                    <CommandEmpty>No tags yet</CommandEmpty>
                  ) : filteredTags.length === 0 ? (
                    <CommandEmpty>No matching tags</CommandEmpty>
                  ) : (
                    filteredTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => handleSelect(tag)}
                        >
                          <div
                            className={cn(
                              'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <Tag className="text-muted-foreground mr-2 h-3 w-3" />
                          {tag}
                        </CommandItem>
                      );
                    })
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// Bulk TagPicker for multiple items
interface BulkTagPickerProps {
  ids: string[];
  paths: string[];
  className?: string;
  triggerClassName?: string;
}

export const BulkTagPicker: React.FC<BulkTagPickerProps> = ({
  ids,
  paths,
  className,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const refs = useRefStore((state) => state.refs);

  // Get all unique tags from all refs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    refs.forEach((ref) => {
      const tags = ref.metadata.tags;
      if (tags) {
        tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [refs]);

  // Filter tags based on input
  const filteredTags = useMemo(() => {
    if (!inputValue) return allTags;
    const search = inputValue.toLowerCase();
    return allTags.filter((tag) => tag.toLowerCase().includes(search));
  }, [allTags, inputValue]);

  // Check if input matches any existing tag exactly
  const exactMatch = allTags.some(
    (tag) => tag.toLowerCase() === inputValue.toLowerCase(),
  );

  const handleAddTagToAll = async (tag: string) => {
    // Add tag to all selected items
    for (let i = 0; i < ids.length; i++) {
      await emit('tag_added', { id: ids[i], tag, path: paths[i] });
    }
    setInputValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-7 gap-1 text-xs', triggerClassName)}
        >
          <Tag className="h-3 w-3" />
          Add Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create tag..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {/* Create new tag option */}
            {inputValue && !exactMatch && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleAddTagToAll(inputValue.trim())}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{inputValue}" and add to all
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Existing tags */}
            <CommandGroup heading={inputValue ? 'Matching tags' : 'All tags'}>
              {filteredTags.length === 0 && !inputValue ? (
                <CommandEmpty>No tags yet</CommandEmpty>
              ) : filteredTags.length === 0 ? (
                <CommandEmpty>No matching tags</CommandEmpty>
              ) : (
                filteredTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => handleAddTagToAll(tag)}
                  >
                    <Tag className="text-muted-foreground mr-2 h-3 w-3" />
                    {tag}
                    <span className="text-muted-foreground ml-auto text-[10px]">
                      Add to {ids.length} items
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TagPicker;
