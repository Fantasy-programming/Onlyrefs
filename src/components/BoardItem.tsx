interface BoardItemProps {
  image: string;
  index: number;
}

const BoardItem = ({ image, index }: BoardItemProps) => {
  return (
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
  );
};

export default BoardItem;
