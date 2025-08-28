import { Suspense } from 'react';
import Board from '@/components/Board/Board';
import { getRefs } from '@/resources/refs.resource';

const Home = () => {
  const refs = getRefs();

  return (
    <Suspense fallback={<div>loading...</div>}>
      <Board collection="all" refs={refs} />
    </Suspense>
  );
};

export default Home;
