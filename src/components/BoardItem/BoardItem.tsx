import { Component, ParentProps, Switch, Match } from 'solid-js';
import { deleteRef } from '~/lib/helper.ts';
import { useRefSelector } from '~/state/store';
import { BoardItemProps, RefContextMenuProps } from './BoardItem.types.ts';
import { MediaRef, NoteRef } from '~/lib/types.ts';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu.tsx';

import { Dialog, DialogTrigger } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { ViewBox } from '../ViewBox/ViewBox.tsx';
import { NoteItem } from './BoardNoteItem.tsx';

const refHeigts = ['440px', '300px', '400px', '500px', '350px'];
const getRandomHeight = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const BoardItem = (props: BoardItemProps) => {
  const type = props.refItem?.metadata?.media_type?.split('/')[0];
  const isVideo = type === 'video';
  const isImage = type === 'image';
  const isNote = type === 'text';

  return (
    <Switch>
      <Match when={isImage}>
        <RefContextMenu
          collectionName={props.refItem.metadata.collection}
          refID={props.refItem.metadata.id}
        >
          <ImageItem mediaInfo={props.refItem as MediaRef} type="image" />
        </RefContextMenu>
      </Match>
      <Match when={isVideo}>
        <RefContextMenu
          collectionName={props.refItem.metadata.collection}
          refID={props.refItem.metadata.id}
        >
          <VideoItem mediaInfo={props.refItem as MediaRef} />
        </RefContextMenu>
      </Match>
      <Match when={isNote}>
        <RefContextMenu
          collectionName={props.refItem.metadata.collection}
          refID={props.refItem.metadata.id}
          type="note"
        >
          <NoteItem noteInfo={props.refItem as NoteRef} />
        </RefContextMenu>
      </Match>
    </Switch>
  );
};

// Render an image into the board
const ImageItem = (props: { mediaInfo: MediaRef; type: string }) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full rounded-xl">
        <div
          class={`cursor-pointer  rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20`}
          style={{
            'aspect-ratio': `${props?.mediaInfo?.metadata?.dimensions[0]}/${props?.mediaInfo?.metadata?.dimensions[1]}`,
            'background-image': `url(${props?.mediaInfo?.low_res_imagepath})`,
          }}
        />
        {props.mediaInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.mediaInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>
      <ViewBox source={props.mediaInfo} type="image" />
    </Dialog>
  );
};

// Render a video into the board
const VideoItem = (props: { mediaInfo: MediaRef }) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full rounded-xl">
        <div
          class="relative cursor-pointer overflow-hidden rounded-xl border border-transparent shadow-md hover:border-primary"
          style={{
            height: getRandomHeight(refHeigts),
          }}
        >
          <video
            class="absolute h-full w-full rounded-xl object-cover"
            src={props?.mediaInfo?.imagepath}
            preload="auto"
            autoplay
            loop
            muted
          ></video>
        </div>
        {props.mediaInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.mediaInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>
      <ViewBox source={props?.mediaInfo} type="video" />
    </Dialog>
  );
};

const RefContextMenu: Component<ParentProps & RefContextMenuProps> = (
  props,
) => {
  const root = useRefSelector();

  return (
    <ContextMenu>
      <ContextMenuTrigger class={`${props.type}`}>
        {props.children}
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="w-48">
          {/* <ContextMenuSub overlap> */}
          {/*   <ContextMenuSubTrigger>Add to Board</ContextMenuSubTrigger> */}
          {/*   <ContextMenuPortal> */}
          {/*     <ContextMenuSubContent> */}
          {/*       <ContextMenuRadioGroup */}
          {/*         value={board()} */}
          {/*         onChange={moveToCollection} */}
          {/*       > */}
          {/* <For each={props.collections()}> */}
          {/*   {(collection) => ( */}
          {/*     <ContextMenuRadioItem value={collection.name ?? "all"}> */}
          {/*       {collection.name} */}
          {/*     </ContextMenuRadioItem> */}
          {/*   )} */}
          {/* </For> */}
          {/*       </ContextMenuRadioGroup> */}
          {/*     </ContextMenuSubContent> */}
          {/*   </ContextMenuPortal> */}
          {/* </ContextMenuSub> */}
          <ContextMenuItem
            onSelect={async () => {
              if (props.refID === undefined) {
                return;
              }
              await deleteRef(props.refID);
              await root.refetchRefs();
            }}
          >
            <span>Delete Ref</span>
            <ContextMenuShortcut>⌘+T</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  );
};

export const BoardItemSkeleton = ({ index }: { index: number }) => {
  return (
    <Skeleton
      class={`m-3 cursor-pointer rounded-xl shadow-md`}
      style={{
        height: index % 2 ? '300px' : '440px',
      }}
    />
  );
};
