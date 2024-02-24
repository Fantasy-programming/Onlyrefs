import { Show } from "solid-js";

interface BoardItemProps {
  image: string;
  index: number;
}

const BoardItem = ({ image, index }: BoardItemProps) => {
  const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1) : "";
  };

  const extension = getFileExtension(image);

  const isVideo = ["mp4", "webm", "ogg"].includes(extension);

  return (
    <Show
      when={!isVideo}
      fallback={
        <div
          class="rounded-xl m-3 relative cursor-pointer overflow-hidden hover:border hover:border-slate-200 shadow-md"
          style={{
            height: index % 2 ? "300px" : "440px",
          }}
        >
          <video
            class=" object-cover h-full w-full rounded-xl absolute"
            src={image}
            preload="auto"
            autoplay
            loop
            muted
          ></video>
        </div>
      }
    >
      <div
        class={`rounded-xl m-3 cursor-pointer hover:border hover:border-slate-200 shadow-md`}
        style={{
          height: index % 2 ? "300px" : "440px",
          background: `url(${image})`,
          "background-size": "cover",
          "background-position": "center",
          "background-repeat": "no-repeat",
        }}
      />
    </Show>
  );
};

export default BoardItem;
