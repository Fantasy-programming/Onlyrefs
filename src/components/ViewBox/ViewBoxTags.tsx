import React from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

interface TagProps {
  name: string;
  removeTag: (name: string) => void;
  children?: React.ReactNode;
}

export const ViewBoxTag: React.FC<TagProps> = ({ name, removeTag, children }) => {
  return (
    <motion.span className="group relative mb-[7px] mr-[5px] inline-flex whitespace-nowrap">
      <span className="cursor-zoom-in text-nowrap rounded-full bg-primary px-3 py-[6px] text-lg text-primary-foreground hover:bg-primary/20">
        # {children}
      </span>
      <span
        className="absolute -right-1 -top-1  cursor-pointer rounded-full bg-primary  p-[2px] opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => removeTag(name)}
      >
        <IoCloseOutline />
      </span>
    </motion.span>
  );
};

export default ViewBoxTag;
