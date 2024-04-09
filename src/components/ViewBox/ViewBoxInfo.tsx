import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { VsAdd } from 'solid-icons/vs';
import { Metadata, NoteMetadata } from '../../lib/types';
import { ViewBoxTag } from './ViewBoxTags';
import { debounce } from '@solid-primitives/scheduled';
import { For, JSX, Match, Show, Switch, createSignal } from 'solid-js';
import { RiSystemDeleteBin6Line } from 'solid-icons/ri';
import { OcShare3 } from 'solid-icons/oc';
import { TbLayoutDashboard } from 'solid-icons/tb';

import {
  addTag,
  changeRefName,
  deleteRef,
  deleteTag,
  elapsedTime,
  isMedia_Metadata,
  saveMediaToDisk,
} from '../../lib/helper';
import { useRefSelector } from '~/state/store';
import { Motion, Presence } from 'solid-motionone';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { As } from '@kobalte/core';

const debouncedSave = debounce(
  async (
    value: string,
    id: string,
    path: string,
    type: string,
    more: (id: string, value: string) => void,
  ) => {
    await changeRefName(id, value, path, type);
    more(id, value);
  },
  1000,
);

export const ViewBoxInfo = (props: {
  metadata: Metadata | NoteMetadata;
  path: string;
  type: string;
}) => {
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [inputValue, setInputValue] = createSignal('');
  const [showAllTags, setShowAllTags] = createSignal(false);
  const root = useRefSelector();

  const handleInputChange: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    setInputValue(event.currentTarget.value);
  };

  // debounce getting the input value
  const handleNameInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    debouncedSave(
      event.currentTarget.value,
      props.metadata.id,
      props.path,
      props.type,
      root.mutateName,
    );
  };

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    event,
  ) => {
    event.preventDefault();
    if (inputValue() === '') return;
    if (props.metadata.tags?.includes(inputValue())) {
      setInputValue('');
      return;
    }
    if (!props.metadata.tags) {
      await addTag(props.metadata.id, props.path, props.type, inputValue());
      root.mutateTag(props.metadata.id, inputValue(), 'add');
      setInputValue('');
      return;
    }
    if (props.metadata.tags) {
      await addTag(props.metadata.id, props.path, props.type, inputValue());
      root.mutateTag(props.metadata.id, inputValue(), 'add');
      setInputValue('');
      return;
    }
  };

  const removeTag = async (name: string) => {
    await deleteTag(props.metadata.id, props.path, props.type, name);
    root.mutateTag(props.metadata.id, name, 'remove');
  };

  return (
    <div class="static right-0 top-0 z-10 h-full w-full rounded-t-xl  bg-background md:rounded-xl lg:absolute lg:my-2  lg:mr-2 lg:h-[calc(100%-(0.5rem*2))] lg:w-[400px]">
      <header class="flex flex-col gap-3 rounded-t-xl bg-gradient-to-tr from-primary/80 to-primary/40  p-7 ">
        <input
          type="text"
          class="h-[50px] border-none bg-transparent text-3xl outline-none "
          autofocus
          onInput={handleNameInput}
          value={props.metadata.name}
        />
        <span class="text-sm">{elapsedTime(props.metadata.created_at)}</span>
      </header>
      <div class="p-4">
        <h4 class="text-lg uppercase">Tags</h4>
        <div class="my-3 transition-all">
          <Presence>
            <Show when={openTagsAdder()}>
              <Motion.form
                animate={{ opacity: [0, 1], y: [-10, 0] }}
                exit={{ opacity: [1, 0] }}
                class="pb-5"
                onSubmit={handleSubmit}
              >
                <div class="focus-within:ring-offset-3 flex rounded-sm ring-offset-foreground/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
                  <Input
                    type="text"
                    class="h-[50px] w-full rounded-r-none border-none  bg-foreground/10 text-lg ring-offset-current focus-visible:ring-offset-0"
                    value={inputValue()}
                    onInput={handleInputChange}
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
        <Show when={props.type === 'image' || props.type === 'video'}>
          <h4 class="text-lg uppercase underline decoration-wavy underline-offset-[6px]">
            Info
          </h4>
          <div class="my-3">
            <Switch>
              <Match when={props.type === 'image'}>
                <ViewBoxInfoImage
                  dimensions={(props.metadata as Metadata).dimensions}
                  file_size={(props.metadata as Metadata).file_size}
                  media_type={(props.metadata as Metadata).media_type}
                />
              </Match>
              <Match when={props.type === 'video'}>
                <div>video here</div>
              </Match>
            </Switch>
          </div>
          <h4 class="text-lg uppercase underline decoration-wavy underline-offset-[6px]">
            Notes
          </h4>
          <div class="my-3"></div>
        </Show>
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
                  (props.metadata as Metadata).file_name,
                );
              }
            }}
          >
            <As
              component={Button}
              size="round"
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
              deleteRef(props.metadata.id);
              root.deleteRef(props.metadata.id);
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
