import { writeText } from "@tauri-apps/api/clipboard";
import { Component, For, ParentProps } from "solid-js";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { MediaRef } from "../../lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const ViewBox: Component<ParentProps & { source: MediaRef }> = ({
  children,
  source,
}) => {
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
                  <Tooltip flip={true} placement="top" openDelay={150}>
                    <TooltipTrigger
                      class="transition-all delay-200"
                      onClick={async () => await writeText(color)}
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
          class="infobox z-10  top-0 right-0 my-2 mr-2 w-[400px] absolute bg-background   h-[95%] rounded-xl"
          style={{
            height: "calc(100% - (0.5rem * 2))",
          }}
        >
          <header class="flex flex-col gap-3 p-7">
            <input
              type="text"
              class="outline-none border-none h-[50px] text-4xl bg-transparent"
              value={source.metadata.file_name}
            />
            <span class="text-sm">{source.metadata.collection}</span>
          </header>
          <div class="info">
            <div>
              <h4>MIND TAGS</h4>
              <div class="tags" />
              <h4>INFO</h4>
              <div>
                <span>Dimension: </span>
                <span>{source.metadata.dimensions.join(" x ")}</span>
              </div>
              <div>
                <span>Date_added:</span>
              </div>
            </div>
          </div>
          <div class="actions absolute bottom-0 px-4 pb-4 w-full z-30"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
