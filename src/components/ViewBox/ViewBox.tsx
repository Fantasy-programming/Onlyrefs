import { Component, ParentProps } from "solid-js";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

interface ViewProps {
  source: string;
}

export const ViewBox: Component<ParentProps & ViewProps> = ({
  source,
  children,
}) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full">{children}</DialogTrigger>
      <DialogContent class="w-[90%] h-[90%] max-w-none max-h-none">
        <div class="relative">
          <div
            class="w-1/3 bottom-1/2 left-[30%] -translate-x-1/2 translate-y-1/2 absolute h-[90%] rounded-xl bg-cover bg-center bg-no-repeat "
            style={{
              "background-image": `url(${source})`,
            }}
          ></div>
          <div class="colors absolute"></div>
          <div class="infobox w-1/3 absolute bg-foreground/50  bottom-1/2  translate-y-1/2 right-1 h-[95%] rounded-xl"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
