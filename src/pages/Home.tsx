import { Motion } from "solid-motionone";
import Board from "../components/Board/Board";

const Home = () => {
  return (
    <>
      <Motion.div animate={{ opacity: [0, 1] }}>
        <div class="input-component"></div>
        <Board collection="all" />
      </Motion.div>
    </>
  );
};

export default Home;
