import { writeText } from "@tauri-apps/api/clipboard";
import { IoCloseOutline } from "solid-icons/io";
import { VsAdd } from "solid-icons/vs";
import { Component, For, JSX, ParentProps, Show, createSignal } from "solid-js";
import { addTag } from "../../lib/helper";
import { MediaRef } from "../../lib/types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// TODO: Make it work for videos

export const ViewBox: Component<ParentProps & { source: MediaRef }> = ({
  children,
  source,
}) => {
  console.log(source.metadata.tags);
  const [openTagsAdder, setOpenTagsAdder] = createSignal(false);
  const [inputValue, setInputValue] = createSignal("");
  const [showAllTags, setShowAllTags] = createSignal(false);

  const handleInputChange: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    setInputValue(event.currentTarget.value);
  };

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    event,
  ) => {
    event.preventDefault();
    addTag(source.metadata.id, inputValue());
    setInputValue("");
  };

  return (
    <Dialog>
      <DialogTrigger class="w-full">{children}</DialogTrigger>
      <DialogContent
        class={"w-[90%] p-0 h-[90%] max-w-none max-h-none flex"}
        style={{
          background: source.metadata.colors[0],
        }}
      >
        <div
          class="relative flex py-2 pl-2 flex-grow justify-center items-center"
          style={{
            width: "cacl(100% - 400px)",
            "padding-right": "calc((0.5rem * 2) + 400px)",
          }}
        >
          <div class="rounded-xl p-7 w-full h-full flex justify-center items-center overflow-clip ">
            <img
              src={source.imagepath}
              loading="lazy"
              class="rounded-xl w-auto h-auto"
              style={{
                "max-width": `min(100%, ${source.metadata.dimensions[0]}px )`,
                "max-height": `min(100%, ${source.metadata.dimensions[1]}px )`,
              }}
            />
          </div>
          <div class="flex flex-row-reverse absolute bottom-4 left-4 -space-x-7 space-x-reverse  hover:space-x-0 focus-within:space-x-0   ">
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
                        class="w-10 h-10 rounded-full"
                        classList={{
                          "border-white border": index() === 0,
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
        <div
          class=" z-10  top-0 right-0 my-2 mr-2 w-[400px] absolute bg-background    h-[95%] rounded-xl"
          style={{
            height: "calc(100% - (0.5rem * 2))",
          }}
        >
          <header class="flex flex-col gap-3 p-7 bg-gradient-to-tr from-primary/20 to-background/80  rounded-t-xl ">
            <input
              type="text"
              class="outline-none border-none h-[50px] text-3xl bg-transparent "
              value={source.metadata.name}
              autofocus
            />
            <span class="text-sm">{source.metadata.created_at}</span>
          </header>
          <div class="p-4">
            <div>
              <h4 class="uppercase text-lg">Tags</h4>
              <div class="my-3">
                <form
                  class="transition-all  duration-500 animate-in pb-5"
                  classList={{ hidden: !openTagsAdder() }}
                  onSubmit={handleSubmit}
                >
                  <div class="flex">
                    <Input
                      type="text"
                      class="w-full h-[50px] border-none rounded-r-none bg-foreground/10 text-lg"
                      value={inputValue()}
                      onInput={handleInputChange}
                    />
                    <Button class="rounded-l-none text-lg h-auto rounded-r-sm">
                      <VsAdd />
                    </Button>
                  </div>
                </form>
                <div
                  class="flex flex-row flex-wrap relative overflow-hidden  max-h-36"
                  classList={{
                    "max-h-none": showAllTags(),
                    "overflow-auto": showAllTags(),
                  }}
                  onClick={() => setShowAllTags(true)}
                >
                  <Button
                    class="py-[6px] px-3 mr-[5px] mb-[7px] text-xl"
                    onClick={() => setOpenTagsAdder(!openTagsAdder())}
                  >
                    Add Tags
                  </Button>
                  <Show when={source.metadata?.tags}>
                    <For each={source.metadata.tags}>
                      {(tag) => <Tag>{tag}</Tag>}
                    </For>
                  </Show>
                </div>
              </div>
              <h4 class="uppercase text-lg">Info</h4>
              <div class="my-3">
                <div class="text-lg">
                  <span class="font-semibold">Dimension: </span>
                  <span>{source.metadata.dimensions.join(" x ")}</span>
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
              <div class="my-3">
                <textarea
                  class="w-full h-[50px] border-none"
                  placeholder="Add Notes"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="actions absolute bottom-0 px-4 pb-4 w-full z-30"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Tag = (props: ParentProps) => {
  return (
    <span class="relative whitespace-nowrap inline-flex mr-[5px] mb-[7px] group">
      <span class="py-[6px] px-3 text-nowrap rounded-full text-xl   bg-primary hover:bg-primary/20 text-foreground">
        # {props.children}
      </span>
      <span class="absolute group-hover:opacity-100 opacity-0  transition-opacity -top-1 -right-1  p-[2px] bg-primary rounded-full">
        <IoCloseOutline />
      </span>
    </span>
  );
};
