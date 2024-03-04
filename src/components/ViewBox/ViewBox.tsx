import { Component, ParentProps } from "solid-js";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { MediaRef } from "../../lib/types";

export const ViewBox: Component<ParentProps & { source: MediaRef }> = ({
  children,
  source,
}) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full">{children}</DialogTrigger>
      <DialogContent class="w-[90%] p-0 h-[90%] max-w-none max-h-none flex">
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
          <div class="colors absolute"></div>
        </div>
        <div
          class="infobox z-10  top-0 right-0 my-2 mr-2 w-[400px] absolute bg-foreground/50   h-[95%] rounded-xl"
          style={{
            height: "calc(100% - (0.5rem * 2))",
          }}
        >
          <header class="flex flex-col gap-3 p-7">
            <input type="text" value={source.metadata.file_name} />
            <span class="text-sm">{source.metadata.collection}</span>
          </header>
          <div class="info">tags & such</div>
          <div class="actions absolute bottom-0 px-4 pb-4 w-full z-30"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
