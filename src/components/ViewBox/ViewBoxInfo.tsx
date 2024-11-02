import { For, JSX, Match, Show, Switch, createSignal } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';
import { As } from '@kobalte/core';
import { debounce } from '@solid-primitives/scheduled';
import { emit } from '@tauri-apps/api/event';
import toast from 'solid-toast';

import { ViewBoxInfoProps } from './ViewBox.types';

import { Input } from '../ui/input-old';
import { Button } from '../ui/button-old';

import { RiSystemDeleteBin6Line } from 'solid-icons/ri';
import { TbLayoutDashboard } from 'solid-icons/tb';
import { OcShare3 } from 'solid-icons/oc';
import { VsAdd } from 'solid-icons/vs';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip-old';
import { ViewBoxTag } from './ViewBoxTags';

import {
  elapsedTime,
  isMedia_Metadata,
  saveMediaToDisk,
} from '../../lib/helper';
import { ImageMetadata } from '~/lib/types';
import { ViewNoteEditor } from './ViewNoteEditor';
import { getSettings } from '~/resources/settings.resource';

export const ViewBoxInfo = (props: ViewBoxInfoProps) => {
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [showAllTags, setShowAllTags] = createSignal(false);
  const settings = getSettings();

  const [inputValue, setInputValue] = createSignal('');

  const handleTagInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    setInputValue(event.currentTarget.value);
  };

  const debouncedSave = debounce(
    async (id: string, value: string, path: string) => {
      emit('ref_name_changed', {
        id: id,
        name: value,
        path: path,
      });
    },
    1000,
  );

  const handleNameInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    debouncedSave(props.metadata.id, event.currentTarget.value, props.path);
  };

  const handleTagSubmit: JSX.EventHandler<
    HTMLFormElement,
    SubmitEvent
  > = async (event) => {
    event.preventDefault();

    if (inputValue() === '') return;

    if (props.metadata.tags?.includes(inputValue())) {
      setInputValue('');
      return;
    }

    emit('tag_added', {
      id: props.metadata.id,
      tag: inputValue(),
      path: props.path,
    });

    setInputValue('');
  };

  const removeTag = async (name: string) => {
    emit('tag_removed', {
      id: props.metadata.id,
      tag: name,
      path: props.path,
    });
  };

  return (
    <div class="absolute right-0 top-0 z-10 h-full w-full  rounded-t-xl border-gray-900/50 bg-background shadow-cardShadowLight  dark:border-gray-100/50 dark:shadow-cardShadow md:rounded-xl lg:absolute lg:my-2 lg:mr-2 lg:h-[calc(100%-(0.5rem*2))] lg:w-[400px]">
      <div class="onlyrefNoise h-full w-full">
        <header class="onlyrefNoise flex flex-col gap-3 rounded-t-xl bg-foreground/5  p-7">
          <input
            type="text"
            class="h-[50px] border-none bg-transparent text-3xl outline-none "
            autofocus
            onInput={handleNameInput}
            value={props.metadata.name}
          />
          <span class="text-sm">{elapsedTime(props.metadata.created_at)}</span>
        </header>
        <div
          class="relative w-full overflow-x-hidden overflow-y-scroll p-4"
          style={{
            height: 'calc(100% - 148px - 64px)',
          }}
        >
          <h4 class="text-lg uppercase">Tags</h4>
          <div class="my-3 transition-all">
            <Presence>
              <Show when={openTagsAdder()}>
                <Motion.form
                  animate={{ opacity: [0, 1], y: [-10, 0] }}
                  exit={{ opacity: [1, 0] }}
                  class="pb-5"
                  onSubmit={handleTagSubmit}
                >
                  <div class="focus-within:ring-offset-3 flex rounded-sm ring-offset-foreground/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      type="text"
                      class="h-[50px] w-full rounded-r-none border-none  bg-foreground/10 text-lg ring-offset-current focus-visible:ring-offset-0"
                      value={inputValue()}
                      onInput={handleTagInput}
                    />
                    <Button class="h-auto rounded-l-none rounded-r-sm text-lg">
                      <VsAdd />
                    </Button>
                  </div>
                </Motion.form>
              </Show>
            </Presence>
            <div
              class="relative flex max-h-36 flex-row flex-wrap overflow-hidden py-3  transition-all"
              classList={{
                'max-h-none': showAllTags(),
                'overflow-auto': showAllTags(),
              }}
              onClick={() => setShowAllTags(true)}
            >
              <Button
                variant="secondary"
                class="mb-[7px] mr-[5px] px-3 py-[6px] text-lg"
                onClick={() => setOpenTagsAdder(!openTagsAdder())}
              >
                Add Tags
              </Button>
              <Show when={props.metadata.tags}>
                <For each={props.metadata.tags}>
                  {(tag) => (
                    <ViewBoxTag name={tag} removeTag={removeTag}>
                      {tag}
                    </ViewBoxTag>
                  )}
                </For>
              </Show>
            </div>
          </div>
          <Show
            when={
              props.metadata.ref_type === 'image' &&
              settings()?.appearance.show_media_info
            }
          >
            <h4 class="text-lg uppercase underline decoration-foreground decoration-wavy underline-offset-[6px]">
              Info
            </h4>
            <div class="my-3">
              <Switch>
                <Match when={props.metadata.ref_type === 'image'}>
                  <ViewBoxInfoImage
                    dimensions={(props.metadata as ImageMetadata).dimensions}
                    file_size={(props.metadata as ImageMetadata).file_size}
                    media_type={(props.metadata as ImageMetadata).media_type}
                  />
                </Match>
                <Match when={props.metadata.ref_type === 'video'}>
                  <div>video here</div>
                </Match>
              </Switch>
            </div>
          </Show>
          <h4 class="text-lg uppercase underline decoration-foreground decoration-wavy underline-offset-[6px]">
            Note
          </h4>
          <div
            class="my-4 "
            style={{
              'max-height': 'calc(100% - 148px - 64px - 100px - 16px)',
              overflow: 'auto',
            }}
          >
            <ViewNoteEditor
              id={props.metadata.id}
              path={props.path}
              content={props.metadata.note_text}
            />
          </div>
          <div class="pointer-events-none absolute bottom-[20px] left-0 h-11 w-full bg-[linear-gradient(180deg,_hsl(var(--background)_/_0.2)_0%,_hsl(var(--background)_/_0.9)_100%)] " />
        </div>
        <div class="bottom-0 z-30 flex w-full items-center justify-center gap-x-3 px-4 pb-4 lg:absolute">
          <Tooltip placement="top" openDelay={50}>
            <TooltipTrigger
              class="transition-all delay-200"
              asChild
              onClick={() => {
                if (isMedia_Metadata(props.metadata)) {
                  saveMediaToDisk(
                    props.metadata.id,
                    (props.metadata as ImageMetadata).file_name,
                  );
                }
              }}
            >
              <As
                component={Button}
                size="round"
                variant="tertiary"
                class="flex h-12 w-12 items-center justify-center  text-white hover:text-white/80"
                aria-label="save ref to pc"
              >
                <OcShare3 class="h-6 w-6" />
              </As>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to Disk</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip placement="top" openDelay={50}>
            <TooltipTrigger class="transition-all delay-200" asChild>
              <As
                component={Button}
                size="round"
                variant="tertiary"
                class="flex h-12 w-12 items-center justify-center text-white hover:text-white/80"
                aria-label="add to board"
              >
                <TbLayoutDashboard class="h-6 w-6" />
              </As>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add To Board</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip placement="top" openDelay={50}>
            <TooltipTrigger
              class="transition-all delay-100"
              asChild
              onClick={() => {
                emit('deleteRef', props.metadata.id);
                toast.success('Ref deleted');
              }}
            >
              <As
                component={Button}
                variant="destructive"
                size="round"
                class="flex h-12 w-12 items-center justify-center  text-white hover:text-white/80"
                aria-label="save ref to pc"
              >
                <RiSystemDeleteBin6Line class="h-6 w-6 " />
              </As>
            </TooltipTrigger>
            <TooltipContent>
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

export const ViewBoxInfoImage = (props: ViewBoxInfoImageProps) => {
  return (
    <>
      <div class="text-lg">
        <span class="font-semibold">Dimension: </span>
        <span>{props.dimensions.join(' x ')}</span>
      </div>
      <div class="text-lg">
        <span class="font-semibold">File Size: </span>
        <span>{props.file_size}</span>
      </div>
      <div class="text-lg">
        <span class="font-semibold">File Type: </span>
        <span>{props.media_type}</span>
      </div>
    </>
  );
};
