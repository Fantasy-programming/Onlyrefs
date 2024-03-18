import { writeText } from '@tauri-apps/api/clipboard';
import { IoCloseOutline } from 'solid-icons/io';
import { VsAdd } from 'solid-icons/vs';
import { Component, For, JSX, ParentProps, Show, createSignal } from 'solid-js';
import { addTag, deleteTag } from '../../lib/helper';
import { MediaRef } from '../../lib/types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

// TODO: Make it work for videos

export const ViewBox: Component<ParentProps & { source: MediaRef }> = ({
  children,
  source,
}) => {
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [inputValue, setInputValue] = createSignal('');
  const [showAllTags, setShowAllTags] = createSignal(false);
  const [tags, setTags] = createSignal(source.metadata.tags);

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
      await addTag(source.metadata.id, inputValue());
      setInputValue('');
      return;
    }
    if (tags()) {
      setTags([...(tags() as string[]), inputValue()]);
      await addTag(source.metadata.id, inputValue());
      setInputValue('');
      return;
    }
  };

  const removeTag = async (name: string) => {
    const newTags = tags()?.filter((tag) => tag !== name);
    await deleteTag(source.metadata.id, name);
    setTags(newTags);
  };

  return (
    <Dialog>
      <DialogTrigger class="w-full">{children}</DialogTrigger>
      <DialogContent
        class={
          'flex h-full max-h-none  w-full max-w-none flex-col overflow-y-scroll p-0 md:h-[90%] md:w-[90%] md:flex-row'
        }
        style={{
          background: source.metadata.colors[0],
        }}
      >
        <div class="relative flex flex-grow flex-col items-center  justify-center p-0 py-2 pl-2 md:w-full md:pr-[calc((0.5rem*2)+400px)]">
          <div class="flex h-full w-full items-center justify-center overflow-clip rounded-xl p-7 ">
            <img
              src={source.imagepath}
              loading="lazy"
              class="h-auto w-auto rounded-xl"
              style={{
                'max-width': `min(100%, ${source.metadata.dimensions[0]}px )`,
                'max-height': `min(100%, ${source.metadata.dimensions[1]}px )`,
              }}
            />
          </div>
          <div class="static bottom-4 left-4 flex flex-row-reverse -space-x-7 space-x-reverse focus-within:space-x-0  hover:space-x-0 md:absolute   ">
            <For each={source.metadata.colors}>
              {(color, index) => (
                <>
                  <Tooltip placement="top" openDelay={150}>
                    <TooltipTrigger
                      class="transition-all delay-200"
                      onClick={async () => await writeText(color)}
                      as="div"
                    >
                      <div
                        class="h-10 w-10 rounded-full"
                        classList={{
                          'border-white border': index() === 0,
                        }}
                        style={{ background: color }}
                      />
                      <TooltipContent>{color}</TooltipContent>
                    </TooltipTrigger>
                  </Tooltip>
                </>
              )}
            </For>
          </div>
        </div>
        <div class="static right-0 top-0 z-10 my-2 mr-2 h-full w-full rounded-xl bg-background md:absolute md:h-[calc(100%-(0.5rem*2))]  md:w-[400px]">
          <header class="flex flex-col gap-3 rounded-t-xl bg-gradient-to-tr from-primary/80 to-primary/40  p-7 ">
            <input
              type="text"
              class="h-[50px] border-none bg-transparent text-3xl outline-none "
              value={source.metadata.name}
              autofocus
            />
            <span class="text-sm">{source.metadata.created_at}</span>
          </header>
          <div class="p-4">
            <div>
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
                <div class="text-lg">
                  <span class="font-semibold">Dimension: </span>
                  <span>{source.metadata.dimensions.join(' x ')}</span>
                </div>
                <div class="text-lg">
                  <span class="font-semibold">File Size: </span>
                  <span>{source.metadata.file_size}</span>
                </div>
                <div class="text-lg">
                  <span class="font-semibold">File Type: </span>
                  <span>{source.metadata.media_type}</span>
                </div>
              </div>
              <h4 class="uppercase">Notes</h4>
              <div class="my-3"></div>
            </div>
          </div>
          <div class="actions absolute bottom-0 z-30 w-full px-4 pb-4"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface TagProps {
  name: string;
  removeTag: (name: string) => void;
}

const ViewBoxTag = (props: ParentProps & TagProps) => {
  return (
    <span class="group relative mb-[7px] mr-[5px] inline-flex whitespace-nowrap">
      <span class="cursor-zoom-in text-nowrap rounded-full bg-primary px-3 py-[6px] text-lg text-primary-foreground hover:bg-primary/20">
        # {props.children}
      </span>
      <span
        class="absolute -right-1 -top-1  cursor-pointer rounded-full bg-primary  p-[2px] opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => props.removeTag(props.name)}
      >
        <IoCloseOutline />
      </span>
    </span>
  );
};
