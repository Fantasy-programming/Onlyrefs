import BoardItem from "./BoardItem";
import { onMount, createSignal } from "solid-js";
import { Mason } from "solid-mason";
import { selectFiles, getCollection, convertSrc } from "../lib/helper";

export interface BoardProps {
  collection: string;
}

const Board = ({ collection }: BoardProps) => {
  const [images, setImages] = createSignal<string[]>([]);

  const getImages = async () => {
    const entries = await getCollection(collection);

    const images: string[] = [];

    for (const entry of entries) {
      const src = convertSrc(entry.path);
      images.push(src);
    }

    setImages(images);
  };

  onMount(() => {
    getImages();
  });

  return (
    <main class="w-full pt-20 h-screen ">
      <div class="mb-8">
        <button
          class="bg-slate-100 cursor-pointer  rounded-lg p-5 text-slate-800"
          onclick={() => selectFiles(collection)}
        >
          Save
        </button>
      </div>
      <Mason
        as="section"
        class="w-full h-full bg-primary  "
        items={images()}
        columns={4}
      >
        {(item, index) => <BoardItem image={item} index={index()} />}
      </Mason>
    </main>
  );
};

export default Board;
