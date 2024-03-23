import { writeText } from '@tauri-apps/api/clipboard';
import { Component, For, Match, ParentProps, Switch } from 'solid-js';
import { MediaRef } from '../../lib/types';
import { DialogContent } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ViewBoxInfo } from './ViewBoxInfo';

// TODO: Make it work for videos

export const ViewBox: Component<
  ParentProps & { source: MediaRef; type: string }
> = (props) => {
  return (
    <DialogContent
      class={
        'flex h-full max-h-none  w-full max-w-none flex-col overflow-y-scroll p-0 md:h-[90%] md:w-[90%] md:flex-row'
      }
      style={{
        background: props.source.metadata.colors[0],
      }}
    >
      <div class="relative flex flex-grow flex-col items-center  justify-center p-0 py-2 pl-2 md:w-full md:pr-[calc((0.5rem*2)+400px)]">
        <div class="flex h-full w-full items-center justify-center overflow-clip rounded-xl p-7">
          <Switch>
            <Match when={props.type === 'video'}>
              <video
                class="h-auto w-auto rounded-xl"
                src={props.source.imagepath}
                preload="auto"
                autoplay
                loop
              ></video>
            </Match>
            <Match when={props.type === 'image'}>
              <img
                src={props.source.imagepath}
                loading="lazy"
                class="h-auto w-auto rounded-xl"
                style={{
                  'max-width': `min(100%, ${props.source.metadata.dimensions[0]}px )`,
                  'max-height': `min(100%, ${props.source.metadata.dimensions[1]}px )`,
                }}
              />
            </Match>
          </Switch>
        </div>
        <div class="static bottom-4 left-4 flex flex-row-reverse -space-x-7 space-x-reverse focus-within:space-x-0  hover:space-x-0 md:absolute   ">
          <For each={props.source.metadata.colors}>
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
      <ViewBoxInfo metadata={props.source.metadata} type={props.type} />
    </DialogContent>
  );
};
