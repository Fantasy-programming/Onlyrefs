import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { VsAdd } from 'solid-icons/vs';
import { Metadata, NoteMetadata } from '../../lib/types';
import { ViewBoxTag } from './ViewBoxTags';
import { debounce } from '@solid-primitives/scheduled';

import { For, JSX, Match, Show, Switch, createSignal } from 'solid-js';

import {
  addTag,
  changeRefName,
  deleteTag,
  elapsedTime,
} from '../../lib/helper';
import { useRefSelector } from '~/state/store';

const debouncedSave = debounce(
  async (value: string, id: string, type: string, more: () => void) => {
    await changeRefName(id, value, type);
    more();
  },
  1000,
);

export const ViewBoxInfo = (props: {
  metadata: Metadata | NoteMetadata;
  type: string;
}) => {
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [inputValue, setInputValue] = createSignal('');
  const [showAllTags, setShowAllTags] = createSignal(false);
  const [tags, setTags] = createSignal(props.metadata.tags);
  const {
    refService: { refetchRefs },
  } = useRefSelector();

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
      props.type,
      refetchRefs,
    );
  };

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    event,
  ) => {
    event.preventDefault();
    if (inputValue() === '') return;
    if (tags()?.includes(inputValue())) {
      setInputValue('');
      return;
    }
    if (!tags()) {
      setTags([inputValue()]);
      await addTag(props.metadata.id, inputValue());
      setInputValue('');
      return;
    }
    if (tags()) {
      setTags([...(tags() as string[]), inputValue()]);
      await addTag(props.metadata.id, inputValue());
      setInputValue('');
      return;
    }
  };

  const removeTag = async (name: string) => {
    const newTags = tags()?.filter((tag) => tag !== name);
    await deleteTag(props.metadata.id, name);
    setTags(newTags);
  };

  return (
    <div class="static right-0 top-0 z-10 h-full w-full rounded-t-xl bg-background md:absolute md:my-2 md:mr-2 md:h-[calc(100%-(0.5rem*2))] md:w-[400px]  md:rounded-xl">
      <header class="flex flex-col gap-3 rounded-t-xl bg-gradient-to-tr from-primary/80 to-primary/40  p-7 ">
        <input
          type="text"
          class="h-[50px] border-none bg-transparent text-3xl outline-none "
          value={props.metadata.name}
          autofocus
          onInput={handleNameInput}
        />
        <span class="text-sm">{elapsedTime(props.metadata.created_at)}</span>
      </header>
      <div class="p-4">
        <h4 class="text-lg uppercase">Tags</h4>
        <div class="my-3">
          <form
            class="pb-5  transition-all duration-500 animate-in"
            classList={{ hidden: !openTagsAdder() }}
            onSubmit={handleSubmit}
          >
            <div class="flex">
              <Input
                type="text"
                class="h-[50px] w-full rounded-r-none border-none bg-foreground/10 text-lg"
                value={inputValue()}
                onInput={handleInputChange}
              />
              <Button class="h-auto rounded-l-none rounded-r-sm text-lg">
                <VsAdd />
              </Button>
            </div>
          </form>
          <div
            class="relative flex max-h-36 flex-row flex-wrap overflow-hidden  py-3"
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
            <Show when={tags()}>
              <For each={tags()}>
                {(tag) => (
                  <ViewBoxTag name={tag} removeTag={removeTag}>
                    {tag}
                  </ViewBoxTag>
                )}
              </For>
            </Show>
          </div>
        </div>
        <h4 class="text-lg uppercase">Info</h4>
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
        <h4 class="uppercase">Notes</h4>
        <div class="my-3"></div>
      </div>
      <div class="actions absolute bottom-0 z-30 w-full px-4 pb-4"></div>
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
