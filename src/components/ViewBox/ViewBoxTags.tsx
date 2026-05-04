import React from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

interface TagProps {
  name: string;
  removeTag: (name: string) => void;
  children?: React.ReactNode;
}

export const ViewBoxTag: React.FC<TagProps> = ({
  name,
  removeTag,
  children,
}) => {
  return (
    <motion.span className="group relative mr-[5px] mb-[7px] inline-flex whitespace-nowrap">
      <span className="bg-primary text-primary-foreground hover:bg-primary/20 cursor-zoom-in rounded-full px-3 py-[6px] text-lg text-nowrap">
        # {children}
      </span>
      <span
        className="bg-primary absolute -top-1 -right-1 cursor-pointer rounded-full p-[2px] opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => removeTag(name)}
      >
        <IoCloseOutline />
      </span>
    </motion.span>
  );
};

export default ViewBoxTag;
