import { Show, children, Component, ParentProps, createSignal } from 'solid-js';
import { deleteRef } from '~/lib/helper.ts';
import { useRefSelector } from '~/state/store';
// import { createTiptapEditor } from "solid-tiptap";
// import StarterKit from "@tiptap/starter-kit";

import { BoardItemProps, RefContextMenuProps } from './BoardItem.types.ts';
import { MediaRef } from '~/lib/types.ts';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuRadioGroup,
} from '../ui/context-menu.tsx';

import { Dialog, DialogTrigger } from '../ui/dialog';

import { Skeleton } from '../ui/skeleton';
import { ViewBox } from '../ViewBox/ViewBox.tsx';

const refHeigts = ['440px', '300px', '400px', '500px', '350px'];

const getRandomHeight = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const BoardItem = ({ image }: BoardItemProps) => {
  const type = image.metadata.media_type.split('/')[0];
  const isVideo = type === 'video';

  return (
    <Show
      when={!isVideo}
      fallback={
        <RefContextMenu
          collectionName={image.metadata.collection}
          refID={image.metadata.id}
        >
          <VideoItem mediaInfo={image} />
        </RefContextMenu>
      }
    >
      <RefContextMenu
        collectionName={image.metadata.collection}
        refID={image.metadata.id}
      >
        <ImageItem mediaInfo={image} type="image" />
      </RefContextMenu>
    </Show>
  );
};

// Render an image into the board
const ImageItem = (props: { mediaInfo: MediaRef; type: string }) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full">
        <div
          class={`cursor-pointer  rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20`}
          style={{
            'aspect-ratio': `${props.mediaInfo.metadata.dimensions[0]}/${props.mediaInfo.metadata.dimensions[1]}`,
            'background-image': `url(${props.mediaInfo.low_res_imagepath})`,
          }}
        />
      </DialogTrigger>
      <ViewBox source={props.mediaInfo} type="image" />
    </Dialog>
  );
};

// Render a video into the board
const VideoItem = (props: { mediaInfo: MediaRef }) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full">
        <div
          class="relative cursor-pointer overflow-hidden rounded-xl border border-transparent shadow-md hover:border-primary"
          style={{
            height: getRandomHeight(refHeigts),
          }}
        >
          <video
            class="absolute h-full w-full rounded-xl object-cover"
            src={props.mediaInfo.imagepath}
            preload="auto"
            autoplay
            loop
            muted
          ></video>
        </div>
      </DialogTrigger>
      <ViewBox source={props.mediaInfo} type="video" />
    </Dialog>
  );
};

export const NewNote = () => {
  let ref!: HTMLDivElement;

  // const editor = createTiptapEditor(() => ({
  //   element: ref!,
  //   extensions: [StarterKit],
  //   content: `<p>Example Text</p>`,
  // }));

  return <div id="editor" ref={ref} />;
};

const RefContextMenu: Component<ParentProps & RefContextMenuProps> = (
  props,
) => {
  const c = children(() => props.children);
  const [board, setBoard] = createSignal(props.collectionName);

  const {
    refService: { refetchRefs },
  } = useRefSelector();

  const moveToCollection = async (collection: string) => {
    if (!props.refID) {
      return;
    }
    setBoard(collection);
    await refetchRefs();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{c()}</ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="w-48">
          <ContextMenuSub overlap>
            <ContextMenuSubTrigger>Add to Board</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuRadioGroup
                  value={board()}
                  onChange={moveToCollection}
                >
                  {/* <For each={props.collections()}> */}
                  {/*   {(collection) => ( */}
                  {/*     <ContextMenuRadioItem value={collection.name ?? "all"}> */}
                  {/*       {collection.name} */}
                  {/*     </ContextMenuRadioItem> */}
                  {/*   )} */}
                  {/* </For> */}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
          <ContextMenuItem
            onSelect={async () => {
              if (props.refID === undefined) {
                return;
              }
              await deleteRef(props.refID);
              await refetchRefs();
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
