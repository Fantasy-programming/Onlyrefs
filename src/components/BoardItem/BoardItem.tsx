import { deleteRef } from "../../lib/helper.ts";
import { createTiptapEditor } from "solid-tiptap";
import StarterKit from "@tiptap/starter-kit";
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
  // ContextMenuRadioItem,
  ContextMenuRadioGroup,
} from "../ui/context-menu.tsx";
import { Skeleton } from "../ui/skeleton";
import {
  Show,
  children,
  Component,
  ParentProps,
  // For,
  createSignal,
} from "solid-js";

import { BoardItemProps, RefContextMenuProps } from "./BoardItem.types.ts";

import { ViewBox } from "../ViewBox/ViewBox.tsx";
import { MediaRef } from "../../lib/types.ts";

const refHeigts = ["440px", "300px", "400px", "500px", "350px"];

const getRandomHeight = (array: string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const BoardItem = ({ image, refresh }: BoardItemProps) => {
  const type = image.metadata.media_type.split("/")[0];
  const isVideo = type === "video";

  return (
    <Show
      when={!isVideo}
      fallback={
        <RefContextMenu
          collectionName={image.metadata.collection}
          refID={image.metadata.id}
          refresh={refresh}
        >
          <VideoItem mediaInfo={image} />
        </RefContextMenu>
      }
    >
      <RefContextMenu
        collectionName={image.metadata.collection}
        refID={image.metadata.id}
        refresh={refresh}
      >
        <ImageItem mediaInfo={image} />
      </RefContextMenu>
    </Show>
  );
};

// Render an image into the board
const ImageItem = (props: { mediaInfo: MediaRef }) => {
  const lowResImagePath = props.mediaInfo.low_res_imagepath;
  const imagePath =
    lowResImagePath !== "" ? lowResImagePath : props.mediaInfo.imagepath;

  return (
    <ViewBox source={props.mediaInfo}>
      <div
        class={`rounded-xl  cursor-pointer border bg-cover bg-center bg-no-repeat border-transparent hover:border-primary hover:shadow-inner hover:shadow-foreground/20 shadow-md transition-all duration-300`}
        style={{
          "aspect-ratio": `${props.mediaInfo.metadata.dimensions[0]}/${props.mediaInfo.metadata.dimensions[1]}`,
          "background-image": `url(${imagePath})`,
        }}
      />
    </ViewBox>
  );
};

export const NewNote = () => {
  let ref!: HTMLDivElement;

  const editor = createTiptapEditor(() => ({
    element: ref!,
    extensions: [StarterKit],
    content: `<p>Example Text</p>`,
  }));

  return <div id="editor" ref={ref} />;
};

// Render a video into the board
const VideoItem = (props: { mediaInfo: MediaRef }) => {
  return (
    <div
      class="rounded-xl p-3 relative cursor-pointer overflow-hidden border border-transparent hover:border-primary shadow-md"
      style={{
        height: getRandomHeight(refHeigts),
      }}
    >
      <video
        class="object-cover h-full w-full rounded-xl absolute"
        src={props.mediaInfo.imagepath}
        preload="auto"
        autoplay
        loop
        muted
      ></video>
    </div>
  );
};

const RefContextMenu: Component<ParentProps & RefContextMenuProps> = (
  props,
) => {
  const c = children(() => props.children);
  const [board, setBoard] = createSignal(props.collectionName);

  const moveToCollection = async (collection: string) => {
    if (!props.refID) {
      return;
    }
    // await moveRef(props.collectionName, collection, props.refID);
    setBoard(collection);
    props.refresh();
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
              props.refresh();
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
      class={`rounded-xl m-3 cursor-pointer shadow-md`}
      style={{
        height: index % 2 ? "300px" : "440px",
      }}
    />
  );
};
