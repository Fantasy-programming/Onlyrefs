import { writeText } from '@tauri-apps/api/clipboard';
import {
  Component,
  For,
  Match,
  ParentProps,
  Show,
  Switch,
  createSignal,
} from 'solid-js';
import { ImageRef, NoteRef, Ref, VideoRef } from '../../lib/types';
import { DialogContent } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ViewBoxInfo } from './ViewBoxInfo';
import { NoteEditor } from '../BoardItem/BoardNoteItem';
import { ViewBoxZoom } from './ViewBoxZoom';

export const ViewBox: Component<ParentProps & { source: Ref }> = (props) => {
  let videoRef: HTMLVideoElement | undefined;

  const [videoDimensions, setVideoDimensions] = createSignal({
    width: 0,
    height: 0,
  });

  const handleVideoLoadedMetadata = () => {
    if (videoRef) {
      setVideoDimensions({
        width: videoRef.videoWidth,
        height: videoRef.videoHeight,
      });
    }
  };

  return (
    <DialogContent
      class={
        'flex h-full max-h-none  w-full max-w-none flex-col overflow-y-scroll p-0 lg:h-[90%] lg:w-[90%] lg:flex-row'
      }
    >
      <div class="relative flex flex-grow flex-col items-center  justify-center p-0 py-2 pl-2 lg:w-full lg:pr-[calc((0.5rem*2)+400px)]">
        <div class="flex h-full w-full items-center justify-center overflow-clip rounded-xl p-7">
          <Switch>
            <Match when={props.source.metadata.ref_type === 'video'}>
              <video
                ref={(el) => (videoRef = el)}
                class="aspect-video h-auto w-auto rounded-xl"
                src={(props.source as VideoRef).video_path}
                preload="auto"
                autoplay
                controls
                loop
                onLoadedMetadata={handleVideoLoadedMetadata}
                style={{
                  'max-width': `min(100%, ${videoDimensions().width}px)`,
                  'max-height': `min(100%, ${videoDimensions().height}px)`,
                }}
              ></video>
            </Match>
            <Match when={props.source.metadata.ref_type === 'image'}>
              <ViewBoxZoom>
                <img
                  src={(props.source as ImageRef).image_path}
                  loading="lazy"
                  class="h-auto w-auto rounded-xl"
                  style={{
                    'max-width': `min(100%, ${(props.source as ImageRef).metadata.dimensions[0]}px )`,
                    'max-height': `min(100%, ${(props.source as ImageRef).metadata.dimensions[1]}px )`,
                  }}
                />
              </ViewBoxZoom>
            </Match>

            <Match when={props.source.metadata.ref_type === 'note'}>
              <NoteEditor source={props.source as NoteRef} />
            </Match>
          </Switch>
        </div>
        <div class="static bottom-4 left-4 flex flex-row-reverse -space-x-7 space-x-reverse focus-within:space-x-0  hover:space-x-0 lg:absolute">
          <Show when={props.source.metadata.ref_type === 'image'}>
            <For each={(props.source as ImageRef).metadata.colors}>
              {(color, index) => {
                const [copy, copied] = createSignal(false);
                return (
                  <>
                    <Tooltip
                      placement="top"
                      openDelay={150}
                      open={copy() ? true : undefined}
                    >
                      <TooltipTrigger
                        class="rounded-full transition-all delay-200"
                        onClick={async () => {
                          copied(true);
                          setTimeout(() => copied(false), 800);
                          await writeText(color);
                        }}
                        as="div"
                      >
                        <div
                          class="h-10 w-10 rounded-full"
                          classList={{
                            'border-white border': index() === 0,
                          }}
                          style={{ background: color }}
                        />
                        <TooltipContent>
                          {copy() ? 'Copied!' : color}
                        </TooltipContent>
                      </TooltipTrigger>
                    </Tooltip>
                  </>
                );
              }}
            </For>
          </Show>
        </div>
      </div>
      <ViewBoxInfo
        metadata={props.source.metadata}
        path={props.source.metapath}
      />
    </DialogContent>
  );
};
