import React, { useRef, useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { ImageRef, LinkRef, NoteRef, Ref, VideoRef } from '../../lib/types';
import { toAssetUrl } from '../../lib/helper';
import { DialogContent } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ViewBoxInfo } from './ViewBoxInfo';
import { NoteEditor } from '../BoardItem/BoardNoteItem';
import ViewBoxZoom from './ViewBoxZoom';

interface ViewBoxProps {
  source: Ref;
}

export const ViewBox: React.FC<ViewBoxProps> = ({ source }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

  return (
    <DialogContent
      className={
        'flex h-full max-h-none w-full max-w-none flex-col p-0 lg:h-[90%] lg:w-[90%] lg:flex-row'
      }
    >
      <div
        className={`relative flex flex-grow flex-col items-center justify-center p-0 py-2 pl-2 lg:w-full lg:pr-[calc((0.5rem*2)+400px)] ${
          source.metadata.ref_type === 'image'
            ? 'overflow-x-hidden overflow-y-auto overscroll-none'
            : ''
        }`}
      >
        <div className="flex h-full w-full items-center justify-center overflow-scroll rounded-xl p-7">
          {source.metadata.ref_type === 'video' ? (
            <video
              ref={videoRef}
              className="aspect-video h-auto w-auto rounded-xl"
              src={toAssetUrl((source as VideoRef).video_path)}
              preload="auto"
              autoPlay
              controls
              loop
              onLoadedMetadata={handleVideoLoadedMetadata}
              style={
                {
                  maxWidth: `min(100%, ${videoDimensions.width}px)`,
                  maxHeight: `min(100%, ${videoDimensions.height}px)`,
                } as React.CSSProperties
              }
            />
          ) : source.metadata.ref_type === 'image' ? (
            <ViewBoxZoom>
              <img
                src={toAssetUrl((source as ImageRef).image_path)}
                loading="lazy"
                className="h-auto w-auto rounded-xl"
                style={
                  {
                    maxWidth: `min(100%, ${(source as ImageRef).metadata.dimensions[0]}px )`,
                    maxHeight: `min(100%, ${(source as ImageRef).metadata.dimensions[1]}px )`,
                  } as React.CSSProperties
                }
              />
            </ViewBoxZoom>
          ) : source.metadata.ref_type === 'note' ? (
            <NoteEditor source={source as NoteRef} />
          ) : source.metadata.ref_type === 'link' ? (
            <div>
              <img
                src={toAssetUrl((source as LinkRef).snapshoot)}
                loading="lazy"
                className="h-auto w-full rounded-xl object-contain"
              />
            </div>
          ) : null}
        </div>

        <div className="static bottom-4 left-4 flex flex-row-reverse -space-x-7 space-x-reverse focus-within:space-x-0 hover:space-x-0 lg:absolute">
          {source.metadata.ref_type === 'image' && (
            <>
              {(source as ImageRef).metadata.colors.map((color, index) => {
                const [, setCopied] = [false, (_: boolean) => {}];

                return (
                  <Tooltip key={color} delayDuration={150} open={undefined}>
                    <TooltipTrigger
                      className="rounded-full transition-all delay-200"
                      onClick={async () => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 800);
                        await writeText(color);
                      }}
                      asChild
                    >
                      <div
                        className={`h-10 w-10 rounded-full ${index === 0 ? 'border border-white' : ''}`}
                        style={{ background: color } as React.CSSProperties}
                      />
                      <TooltipContent side="top">
                        {/* Could show copied state or color */ color}
                      </TooltipContent>
                    </TooltipTrigger>
                  </Tooltip>
                );
              })}
            </>
          )}
        </div>
      </div>
      <React.Suspense fallback={null}>
        <ViewBoxInfo metadata={source.metadata} path={source.metapath} />
      </React.Suspense>
    </DialogContent>
  );
};

export default ViewBox;
