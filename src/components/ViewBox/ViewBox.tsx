import { writeText } from '@tauri-apps/api/clipboard';
import { Component, For, Match, ParentProps, Show, Switch } from 'solid-js';
import { MediaRef, NoteRef, Ref } from '../../lib/types';
import { DialogContent } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ViewBoxInfo } from './ViewBoxInfo';
import { NoteEditor } from '../BoardItem/BoardNoteItem';
import { ViewBoxZoom } from './ViewBoxZoom';

const isMediaRef = (source: Ref): source is MediaRef => {
  return 'colors' in (source.metadata as any);
};

export const ViewBox: Component<ParentProps & { source: Ref; type: string }> = (
  props,
) => {
  return (
    <DialogContent
      class={
        'flex h-full max-h-none  w-full max-w-none flex-col overflow-y-scroll p-0 md:h-[90%] md:w-[90%] md:flex-row'
      }
      style={{
        background: isMediaRef(props.source)
          ? props.source.metadata.colors[0]
          : undefined,
      }}
    >
      <div class="relative flex flex-grow flex-col items-center  justify-center p-0 py-2 pl-2 md:w-full md:pr-[calc((0.5rem*2)+400px)]">
        <div class="flex h-full w-full items-center justify-center overflow-clip rounded-xl p-7">
          <Switch>
            <Match when={props.type === 'video'}>
              <ViewBoxZoom>
                <video
                  class="aspect-video h-auto w-auto rounded-xl"
                  src={(props.source as MediaRef).imagepath}
                  preload="auto"
                  autoplay
                  loop
                ></video>
              </ViewBoxZoom>
            </Match>
            <Match when={props.type === 'image'}>
              <ViewBoxZoom>
                <img
                  src={(props.source as MediaRef).imagepath}
                  loading="lazy"
                  class="h-auto w-auto rounded-xl"
                  style={{
                    'max-width': `min(100%, ${(props.source as MediaRef).metadata.dimensions[0]}px )`,
                    'max-height': `min(100%, ${(props.source as MediaRef).metadata.dimensions[1]}px )`,
                  }}
                />
              </ViewBoxZoom>
            </Match>

            <Match when={props.type === 'note'}>
              <NoteEditor source={props.source as NoteRef} />
            </Match>
          </Switch>
        </div>
        <div class="static bottom-4 left-4 flex flex-row-reverse -space-x-7 space-x-reverse focus-within:space-x-0  hover:space-x-0 md:absolute">
          <Show when={isMediaRef(props.source)}>
            <For each={(props.source as MediaRef).metadata.colors}>
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
          </Show>
        </div>
      </div>
      <ViewBoxInfo
        metadata={props.source.metadata}
        path={props.source.metapath}
        type={props.type}
      />
    </DialogContent>
  );
};
