import { Motion } from 'solid-motionone';
import { Component, Show } from 'solid-js';
import { useRefSelector } from '~/state/store';
import Board from '~/components/Board/Board';

const Home: Component = () => {
  const {
    refService: { ref },
  } = useRefSelector();

  return (
    <Motion.div animate={{ opacity: [0, 1] }}>
      <Show when={ref.length > 0} fallback={<div>Loading...</div>}>
        <Board collection="all" refs={ref} />
      </Show>
    </Motion.div>
  );
};

export default Home;
