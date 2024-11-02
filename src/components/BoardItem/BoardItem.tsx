import { Switch, Match, Show } from 'solid-js';
import { BoardItemProps } from './BoardItem.types.ts';
import { ImageRef, LinkRef, NoteRef, VideoRef } from '~/lib/types.ts';
import { showMenu } from 'tauri-plugin-context-menu';

import { Dialog, DialogTrigger } from '../ui/dialog-old.tsx';
import { Skeleton } from '../ui/skeleton-old.tsx';
import { ViewBox } from '../ViewBox/ViewBox.tsx';
import { NoteContent } from './BoardNoteItem.tsx';
import { createItems } from '~/lib/helper.ts';
import { getSettings } from '~/resources/settings.resource.ts';

export const BoardItem = (props: BoardItemProps) => {
  return (
    <Switch>
      <Match when={props.refItem.metadata.ref_type === 'image'}>
        <ImageItem mediaInfo={props.refItem as ImageRef} />
      </Match>
      <Match when={props.refItem.metadata.ref_type === 'video'}>
        <VideoItem mediaInfo={props.refItem as VideoRef} />
      </Match>
      <Match when={props.refItem.metadata.ref_type === 'note'}>
        <NoteItem noteInfo={props.refItem as NoteRef} />
      </Match>
      <Match when={props.refItem.metadata.ref_type === 'link'}>
        <LinkItem linkInfo={props.refItem as LinkRef} />
      </Match>
    </Switch>
  );
};

// Render an image into the board
const ImageItem = (props: { mediaInfo: ImageRef }) => {
  const showcontext = async (e: MouseEvent) => {
    e.preventDefault();
    showMenu({
      pos: { x: e.clientX, y: e.clientY },
      items: createItems('imagebase', props.mediaInfo.metadata.id),
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        as="div"
        class="w-full rounded-xl"
        tabIndex="-1"
        onContextMenu={showcontext}
      >
        <div
          class={`cursor-pointer rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none `}
          style={{
            'aspect-ratio': `${props?.mediaInfo?.metadata?.dimensions[0]}/${props?.mediaInfo?.metadata?.dimensions[1]}`,
            'background-image': `url(${props?.mediaInfo?.low_res_imagepath})`,
          }}
          tabindex="0"
        />
        {props.mediaInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.mediaInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>

      <ViewBox source={props.mediaInfo} />
    </Dialog>
  );
};

// Render a video into the board
const VideoItem = (props: { mediaInfo: VideoRef }) => {
  const settings = getSettings();

  const showcontext = async (e: MouseEvent) => {
    e.preventDefault();
    showMenu({
      pos: { x: e.clientX, y: e.clientY },
      items: createItems('imagebase', props.mediaInfo.metadata.id),
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        as="div"
        class="w-full rounded-xl"
        tabIndex="-1"
        onContextMenu={showcontext}
      >
        <div
          class="relative h-[400px] cursor-pointer overflow-hidden rounded-xl border border-transparent shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none"
          tabindex="0"
        >
          <video
            class="absolute h-full w-full rounded-xl object-cover"
            src={props?.mediaInfo?.video_path}
            preload={
              settings()?.appearance.video_ref_autoplay ? 'auto' : 'metadata'
            }
            autoplay={settings()?.appearance.video_ref_autoplay}
            loop
            muted
          ></video>
          <Show when={!settings()?.appearance.show_media_info}>
            <div class="absolute inset-0 z-10 flex items-center justify-center">
              <svg
                class="h-16 w-16 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
            </div>
          </Show>
        </div>
        {props.mediaInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.mediaInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>
      <ViewBox source={props?.mediaInfo} />
    </Dialog>
  );
};

// Render a note into the board
const NoteItem = (props: { noteInfo: NoteRef }) => {
  const showcontext = async (e: MouseEvent) => {
    e.preventDefault();
    showMenu({
      pos: { x: e.clientX, y: e.clientY },
      items: createItems('imagebase', props.noteInfo.metadata.id),
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        as="div"
        class="w-full rounded-xl"
        tabIndex="-1"
        onContextMenu={showcontext}
      >
        <div
          class="max-h-[500px] min-h-[50px] w-full cursor-pointer overflow-hidden rounded-xl border border-transparent bg-foreground/10 p-6 text-start shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none"
          tabindex="0"
        >
          <NoteContent data={props.noteInfo} />
        </div>
        {props.noteInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.noteInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>
      <ViewBox source={props.noteInfo} />
    </Dialog>
  );
};

// Render an image into the board
const LinkItem = (props: { linkInfo: LinkRef }) => {
  const showcontext = async (e: MouseEvent) => {
    e.preventDefault();
    showMenu({
      pos: { x: e.clientX, y: e.clientY },
      items: createItems('imagebase', props.linkInfo.metadata.id),
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        as="div"
        class="w-full rounded-xl"
        tabIndex="-1"
        onContextMenu={showcontext}
      >
        <div
          class={`cursor-pointer rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none `}
          style={{
            'aspect-ratio': `4/3`,
            'background-image': `url(${props?.linkInfo?.snapshoot})`,
          }}
          tabindex="0"
        />
        {props.linkInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.linkInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>

      <ViewBox source={props.linkInfo} />
    </Dialog>
  );
};

export const BoardItemSkeleton = () => {
  return (
    <Skeleton class="m-3 h-[300px] w-[200px] cursor-pointer rounded-xl shadow-md md:h-[400px] md:w-[300px]" />
  );
};
