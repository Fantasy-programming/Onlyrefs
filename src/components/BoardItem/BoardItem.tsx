import React from 'react';
import { BoardItemProps } from './BoardItem.types';
import { ImageRef, LinkRef, NoteRef, VideoRef } from '@/lib/types';
// import { showMenu } from 'tauri-plugin-context-menu';

import { Dialog, DialogTrigger } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { ViewBox } from '../ViewBox/ViewBox';
import { NoteContent } from './BoardNoteItem';
// import { createItems } from '@/lib/helper';
import { getSettings } from '@/resources/settings.resource';

export const BoardItem: React.FC<BoardItemProps> = (props) => {
  const type = props.refItem.metadata.ref_type;
  if (type === 'image') return <ImageItem mediaInfo={props.refItem as ImageRef} />;
  if (type === 'video') return <VideoItem mediaInfo={props.refItem as VideoRef} />;
  if (type === 'note') return <NoteItem noteInfo={props.refItem as NoteRef} />;
  return <LinkItem linkInfo={props.refItem as LinkRef} />;
};

// Render an image into the board
const ImageItem = (props: { mediaInfo: ImageRef }) => {
  // const showcontext = async (e: MouseEvent) => {
  //   e.preventDefault();
  //   showMenu({
  //     pos: { x: e.clientX, y: e.clientY },
  //     items: createItems('imagebase', props.mediaInfo.metadata.id),
  //   });
  // };

  return (
    <Dialog>
      <DialogTrigger
        asChild
        className="w-full rounded-xl"
      // tabIndex="-1"
      // onContextMenu={showcontext}
      >
        <div
          className={`cursor-pointer rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none `}
          style={{
            'aspectRatio': `${props?.mediaInfo?.metadata?.dimensions[0]}/${props?.mediaInfo?.metadata?.dimensions[1]}`,
            'backgroundImage': `url(${props?.mediaInfo?.low_res_imagepath})`,
          }}
          tabIndex={0}
        // onContextMenu={showcontext}
        />
        {props.mediaInfo.metadata.name === '' ? null : (
          <p className="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
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

  // const showcontext = async (e: MouseEvent) => {
  //   e.preventDefault();
  //   showMenu({
  //     pos: { x: e.clientX, y: e.clientY },
  //     items: createItems('imagebase', props.mediaInfo.metadata.id),
  //   });
  // };

  return (
    <Dialog>
      <DialogTrigger
        className="w-full rounded-xl"
        asChild
      >
        <div
          className="relative h-[400px] cursor-pointer overflow-hidden rounded-xl border border-transparent shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none"
          tabIndex={0}
        // onContextMenu={showcontext}
        >
          <video
            className="absolute h-full w-full rounded-xl object-cover"
            src={props?.mediaInfo?.video_path}
            preload={
              settings?.appearance.video_ref_autoplay ? 'auto' : 'metadata'
            }
            autoPlay={settings?.appearance.video_ref_autoplay}
            loop
            muted
          ></video>

          {
            !settings?.appearance.show_media_info ? (

              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <svg
                  className="h-16 w-16 animate-spin text-white"
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
            ) : null
          }

        </div>
        {props.mediaInfo.metadata.name === '' ? null : (
          <p className="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
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
  // const showcontext = async (e: MouseEvent) => {
  //   e.preventDefault();
  //   showMenu({
  //     pos: { x: e.clientX, y: e.clientY },
  //     items: createItems('imagebase', props.noteInfo.metadata.id),
  //   });
  // };

  return (
    <Dialog>
      <DialogTrigger
        asChild
        className="w-full rounded-xl"
        tabIndex={-1}
      // onContextMenu={showcontext}
      >
        <div
          className="max-h-[500px] min-h-[50px] w-full cursor-pointer overflow-hidden rounded-xl border border-transparent bg-foreground/10 p-6 text-start shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none"
          tabIndex={0}
        >
          <NoteContent data={props.noteInfo} />
        </div>
        {props.noteInfo.metadata.name === '' ? null : (
          <p className="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
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
  // const showcontext = async (e: MouseEvent) => {
  //   e.preventDefault();
  //   showMenu({
  //     pos: { x: e.clientX, y: e.clientY },
  //     items: createItems('imagebase', props.linkInfo.metadata.id),
  //   });
  // };

  return (
    <Dialog>
      <DialogTrigger
        asChild
        className="w-full rounded-xl"
        tabIndex={-1}
      // onContextMenu={showcontext}
      >
        <div
          className={`cursor-pointer rounded-xl border border-transparent bg-cover bg-center bg-no-repeat shadow-md transition-all duration-300 hover:border-primary hover:shadow-inner hover:shadow-foreground/20 focus-visible:border-primary focus-visible:outline-none `}
          style={{
            'aspectRatio': `4/3`,
            'backgroundImage': `url(${props?.linkInfo?.snapshoot})`,
          }}
          tabIndex={0}
        />
        {props.linkInfo.metadata.name === '' ? null : (
          <p className="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
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
    <Skeleton className="m-3 h-[300px] w-[200px] cursor-pointer rounded-xl shadow-md md:h-[400px] md:w-[300px]" />
  );
};
