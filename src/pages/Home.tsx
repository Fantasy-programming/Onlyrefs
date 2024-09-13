import { Suspense } from 'solid-js';
import { Component } from 'solid-js';
import Board from '~/components/Board/Board';
import { getRefs } from '~/resources/refs.resource';

const Home: Component = () => {
  const refs = getRefs();

  return (
    <Suspense fallback={<div>loading...</div>}>
      <Board collection="all" refs={refs} />
    </Suspense>
  );
};

export default Home;
