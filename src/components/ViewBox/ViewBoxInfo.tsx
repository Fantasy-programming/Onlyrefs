import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emit } from '@tauri-apps/api/event';
import { toast } from 'react-toastify';

import { ViewBoxInfoProps } from './ViewBox.types';

import { Input } from '../ui/input';
import { Button } from '../ui/button';

import { IoTrashOutline } from 'react-icons/io5';
import { TbLayoutDashboard } from 'react-icons/tb';
import { HiOutlineShare } from 'react-icons/hi';
import { VscAdd } from 'react-icons/vsc';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ViewBoxTag } from './ViewBoxTags';

import {
  elapsedTime,
  isMedia_Metadata,
  saveMediaToDisk,
} from '../../lib/helper';
import { ImageMetadata } from '@/lib/types';
import { ViewNoteEditor } from './ViewNoteEditor';
import { getSettings } from '@/resources/settings.resource';

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 1000) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export const ViewBoxInfo: React.FC<ViewBoxInfoProps> = (props) => {
  const [openTagsAdder, setOpenTagsAdder] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const settings = getSettings();

  const [inputValue, setInputValue] = useState('');

  // const handleTagInput = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(event.currentTarget.value);
  // };

  const debouncedSave = useMemo(
    () =>
      debounce(async (id: string, value: string, path: string) => {
        await emit('ref_name_changed', {
          id,
          name: value,
          path,
        });
      }, 1000),
    [],
  );

  const handleNameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSave(props.metadata.id, event.currentTarget.value, props.path);
  };

  const handleTagSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inputValue === '') return;

    if (props.metadata.tags?.includes(inputValue)) {
      setInputValue('');
      return;
    }

    await emit('tag_added', {
      id: props.metadata.id,
      tag: inputValue,
      path: props.path,
    });

    setInputValue('');
  };

  const removeTag = async (name: string) => {
    await emit('tag_removed', {
      id: props.metadata.id,
      tag: name,
      path: props.path,
    });
  };

  return (
    <div className="bg-background shadow-cardShadowLight dark:shadow-cardShadow absolute top-0 right-0 z-10 h-full w-full rounded-t-xl border-gray-900/50 md:rounded-xl lg:absolute lg:my-2 lg:mr-2 lg:h-[calc(100%-(0.5rem*2))] lg:w-[400px] dark:border-gray-100/50">
      <div className="onlyrefNoise h-full w-full">
        <header className="onlyrefNoise bg-foreground/5 flex flex-col gap-3 rounded-t-xl p-7">
          <input
            type="text"
            className="h-[50px] border-none bg-transparent text-3xl outline-none"
            autoFocus
            onChange={handleNameInput}
            defaultValue={props.metadata.name}
          />
          <span className="text-sm">
            {elapsedTime(props.metadata.created_at)}
          </span>
        </header>
        <div
          className="relative w-full overflow-x-hidden overflow-y-scroll p-4"
          style={{ height: 'calc(100% - 148px - 64px)' } as React.CSSProperties}
        >
          <h4 className="text-lg uppercase">Tags</h4>
          <div className="my-3 transition-all">
            <AnimatePresence>
              {openTagsAdder && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pb-5"
                  onSubmit={handleTagSubmit}
                >
                  <div className="ring-offset-foreground/80 focus-within:ring-ring flex rounded-sm focus-within:ring-2 focus-within:ring-offset-3 focus-within:outline-none">
                    <Input
                      type="text"
                      className="bg-foreground/10 h-[50px] w-full rounded-r-none border-none text-lg ring-offset-current focus-visible:ring-offset-0"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.currentTarget.value)}
                    />
                    <Button className="h-auto rounded-l-none rounded-r-sm text-lg">
                      <VscAdd />
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
            <div
              className={`relative flex max-h-36 flex-row flex-wrap ${showAllTags ? 'max-h-none overflow-auto' : 'overflow-hidden'} py-3 transition-all`}
              onClick={() => setShowAllTags(true)}
            >
              <Button
                variant="secondary"
                className="mr-[5px] mb-[7px] px-3 py-[6px] text-lg"
                onClick={() => setOpenTagsAdder((s) => !s)}
              >
                Add Tags
              </Button>
              {props.metadata.tags &&
                props.metadata.tags.map((tag, index) => (
                  <ViewBoxTag
                    key={`${tag}-${index}`}
                    name={tag}
                    removeTag={removeTag}
                  >
                    {tag}
                  </ViewBoxTag>
                ))}
            </div>
          </div>
          {props.metadata.ref_type === 'image' &&
            settings?.appearance?.show_media_info && (
              <>
                <h4 className="decoration-foreground text-lg uppercase underline decoration-wavy underline-offset-[6px]">
                  Info
                </h4>
                <div className="my-3">
                  {props.metadata.ref_type === 'image' ? (
                    <ViewBoxInfoImage
                      dimensions={(props.metadata as ImageMetadata).dimensions}
                      file_size={(props.metadata as ImageMetadata).file_size}
                      media_type={(props.metadata as ImageMetadata).media_type}
                    />
                  ) : (
                    <div>video here</div>
                  )}
                </div>
              </>
            )}
          <h4 className="decoration-foreground text-lg uppercase underline decoration-wavy underline-offset-[6px]">
            Note
          </h4>
          <div
            className="my-4"
            style={
              {
                maxHeight: 'calc(100% - 148px - 64px - 100px - 16px)',
                overflow: 'auto',
              } as React.CSSProperties
            }
          >
            <ViewNoteEditor
              id={props.metadata.id}
              path={props.path}
              content={props.metadata.note_text}
            />
          </div>
          <div className="pointer-events-none absolute bottom-[20px] left-0 h-11 w-full bg-[linear-gradient(180deg,_hsl(var(--background)_/_0.2)_0%,_hsl(var(--background)_/_0.9)_100%)]" />
        </div>
        <div className="bottom-0 z-30 flex w-full items-center justify-center gap-x-3 px-4 pb-4 lg:absolute">
          <Tooltip delayDuration={50}>
            <TooltipTrigger
              className="transition-all delay-200"
              onClick={() => {
                if (isMedia_Metadata(props.metadata)) {
                  saveMediaToDisk(
                    props.metadata.id,
                    (props.metadata as ImageMetadata).file_name,
                  );
                }
              }}
            >
              <Button
                // size="round"
                // variant="tertiary"
                className="flex h-12 w-12 items-center justify-center text-white hover:text-white/80"
                aria-label="save ref to pc"
              >
                <HiOutlineShare className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Save to Disk</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={50}>
            <TooltipTrigger className="transition-all delay-200">
              <Button
                // size="round"
                // variant="tertiary"
                className="flex h-12 w-12 items-center justify-center text-white hover:text-white/80"
                aria-label="add to board"
              >
                <TbLayoutDashboard className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Add To Board</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={50}>
            <TooltipTrigger
              className="transition-all delay-100"
              onClick={() => {
                emit('deleteRef', props.metadata.id);
                toast.success('Ref deleted');
              }}
            >
              <Button
                // variant="destructive"
                // size="round"
                className="flex h-12 w-12 items-center justify-center text-white hover:text-white/80"
                aria-label="save ref to pc"
              >
                <IoTrashOutline className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Delete Ref</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

interface ViewBoxInfoImageProps {
  dimensions: number[];
  file_size: string;
  media_type: string;
}

export const ViewBoxInfoImage: React.FC<ViewBoxInfoImageProps> = (props) => {
  return (
    <>
      <div className="text-lg">
        <span className="font-semibold">Dimension: </span>
        <span>{props.dimensions.join(' x ')}</span>
      </div>
      <div className="text-lg">
        <span className="font-semibold">File Size: </span>
        <span>{props.file_size}</span>
      </div>
      <div className="text-lg">
        <span className="font-semibold">File Type: </span>
        <span>{props.media_type}</span>
      </div>
    </>
  );
};
