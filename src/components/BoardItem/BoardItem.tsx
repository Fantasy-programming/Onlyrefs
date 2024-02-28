import { FileEntry } from "@tauri-apps/api/fs";
import { deleteRef, moveRef } from "../../lib/helper.ts";
import { SourceRef } from "../Board/Board.types.ts";
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
  ContextMenuRadioItem,
  ContextMenuRadioGroup,
} from "../ui/context-menu.tsx";
import { Skeleton } from "../ui/skeleton";
import {
  Show,
  children,
  Component,
  ParentProps,
  For,
  Accessor,
  createSignal,
} from "solid-js";

export interface BoardItemProps {
  image: SourceRef;
  collection: string;
  collections: Accessor<FileEntry[]>;
  index: number;
}

interface BoardItem {
  image: SourceRef;
  index: number;
}

export const BoardItem = ({
  image,
  collection,
  collections,
  index,
}: BoardItemProps) => {
  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1) : "";
  };

  const extension = getFileExtension(image.source);

  const isVideo = ["mp4", "webm", "ogg"].includes(extension);

  return (
    <Show
      when={!isVideo}
      fallback={
        <RefContextMenu
          collectionName={collection}
          collections={collections}
          refID={image.fileName}
        >
          <VideoItem image={image} index={index} />
        </RefContextMenu>
      }
    >
      <RefContextMenu
        collectionName={collection}
        collections={collections}
        refID={image.fileName}
      >
        <ImageItem image={image} index={index} />
      </RefContextMenu>
    </Show>
  );
};

const ImageItem = ({ image, index }: BoardItem) => {
  return (
    <div
      class={`rounded-xl m-3 cursor-pointer border bg-cover bg-center bg-no-repeat border-transparent hover:border-primary hover:shadow-inner hover:shadow-foreground/20 shadow-md transition-all duration-300`}
      style={{
        height: index % 2 ? "300px" : "440px",
        "background-image": `url(${image.source})`,
      }}
      tabindex="0"
      aria-label="image ref"
    />
  );
};

const VideoItem = ({ image, index }: BoardItem) => {
  return (
    <div
      class="rounded-xl m-3 relative cursor-pointer overflow-hidden border border-transparent hover:border-primary shadow-md"
      style={{
        height: index % 2 ? "300px" : "440px",
      }}
      tabindex="0"
      aria-label="video ref"
    >
      <video
        class="object-cover h-full w-full rounded-xl absolute"
        src={image.source}
        preload="auto"
        autoplay
        loop
        muted
      ></video>
    </div>
  );
};

interface RefContextMenuProps {
  collectionName: string;
  collections: Accessor<FileEntry[]>;
  refID: string | undefined;
}

const RefContextMenu: Component<ParentProps & RefContextMenuProps> = (
  props,
) => {
  const c = children(() => props.children);
  const [board, setBoard] = createSignal(props.collectionName);

  const moveToCollection = async (collection: string) => {
    if (!props.refID) {
      return;
    }
    await moveRef(props.collectionName, collection, props.refID);
    setBoard(collection);
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
                  <For each={props.collections()}>
                    {(collection) => (
                      <ContextMenuRadioItem value={collection.name ?? "all"}>
                        {collection.name}
                      </ContextMenuRadioItem>
                    )}
                  </For>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
          <ContextMenuItem
            onSelect={() => {
              if (props.refID === undefined) {
                return;
              }
              deleteRef(props.collectionName, props.refID);
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
