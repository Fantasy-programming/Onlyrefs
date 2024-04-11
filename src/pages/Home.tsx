import { Component } from 'solid-js';
import { useRefSelector } from '~/state/refstore';
import Board from '~/components/Board/Board';

const Home: Component = () => {
  const data = useRefSelector();
  return <Board collection="all" refs={data.ref} />;
};

export default Home;
