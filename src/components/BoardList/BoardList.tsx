import React from 'react';

const BoardList: React.FC<{ boards: string[] }> = ({ boards }) => {
  return (
    <main className="mx-2 grid grid-cols-fluid gap-10 pb-20">
      {boards.map((board) => (
        <a
          key={board}
          className="onlyrefNoise relative h-[300px] max-w-xs rounded-md bg-primary-foreground/10 bg-opacity-70 bg-clip-padding shadow-subtleBtn backdrop-blur-3xl backdrop-filter  transition-all duration-300 hover:shadow-sm hover:shadow-accent dark:hover:shadow-primary-foreground/20"
          href={`/boards/${encodeURIComponent(board)}`}
        >
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl uppercase  italic text-primary-foreground">
            {board}
          </span>
        </a>
      ))}
    </main>
  );
};

export default BoardList;
