import { Motion } from 'solid-motionone';
import Board from '~/components/Board/Board';
import { useRefSelector } from '~/state/store';

const Home = () => {
  const {
    refService: { ref },
  } = useRefSelector();

  return (
    <>
      <Motion.div animate={{ opacity: [0, 1] }}>
        <div class="input-component"></div>
        <Board collection="all" refs={ref} />
      </Motion.div>
    </>
  );
};

export default Home;
