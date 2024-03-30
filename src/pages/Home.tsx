import { Motion } from 'solid-motionone';
import { Component } from 'solid-js';
import { useRefSelector } from '~/state/store';
import Board from '~/components/Board/Board';

const Home: Component = () => {
  const data = useRefSelector();

  return (
    <Motion.div animate={{ opacity: [0, 1] }}>
      <Board collection="all" refs={data.ref} />
    </Motion.div>
  );
};

export default Home;
