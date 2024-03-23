import { ParentProps } from 'solid-js';
import { IoCloseOutline } from 'solid-icons/io';

interface TagProps {
  name: string;
  removeTag: (name: string) => void;
}

export const ViewBoxTag = (props: ParentProps & TagProps) => {
  return (
    <span class="group relative mb-[7px] mr-[5px] inline-flex whitespace-nowrap">
      <span class="cursor-zoom-in text-nowrap rounded-full bg-primary px-3 py-[6px] text-lg text-primary-foreground hover:bg-primary/20">
        # {props.children}
      </span>
      <span
        class="absolute -right-1 -top-1  cursor-pointer rounded-full bg-primary  p-[2px] opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => props.removeTag(props.name)}
      >
        <IoCloseOutline />
      </span>
    </span>
  );
};
