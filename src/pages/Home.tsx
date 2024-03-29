import { Motion } from 'solid-motionone';
import { Component } from 'solid-js';
import { useRefSelector } from '~/state/store';
import Board from '~/components/Board/Board';

const Home: Component = () => {
  const {
    refService: { ref },
  } = useRefSelector();

  return (
    <Motion.div animate={{ opacity: [0, 1] }}>
      <Board collection="all" refs={ref} />
    </Motion.div>
  );
};

export default Home;
