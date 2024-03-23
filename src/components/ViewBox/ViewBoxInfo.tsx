import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { VsAdd } from 'solid-icons/vs';
import { Metadata } from '../../lib/types';
import { ViewBoxTag } from './ViewBoxTags';

import { For, JSX, Match, Show, Switch, createSignal } from 'solid-js';

import { addTag, deleteTag } from '../../lib/helper';

export const ViewBoxInfo = (props: { metadata: Metadata; type: string }) => {
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [inputValue, setInputValue] = createSignal('');
  const [showAllTags, setShowAllTags] = createSignal(false);
  const [tags, setTags] = createSignal(props.metadata.tags);

  const handleInputChange: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    setInputValue(event.currentTarget.value);
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
    <div class="static right-0 top-0 z-10 my-2 mr-2 h-full w-full rounded-xl bg-background md:absolute md:h-[calc(100%-(0.5rem*2))]  md:w-[400px]">
      <header class="flex flex-col gap-3 rounded-t-xl bg-gradient-to-tr from-primary/80 to-primary/40  p-7 ">
        <input
          type="text"
          class="h-[50px] border-none bg-transparent text-3xl outline-none "
          value={props.metadata.name}
          autofocus
        />
        <span class="text-sm">{props.metadata.created_at}</span>
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
                dimensions={props.metadata.dimensions}
                file_size={props.metadata.file_size}
                media_type={props.metadata.media_type}
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
  file_size: number;
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