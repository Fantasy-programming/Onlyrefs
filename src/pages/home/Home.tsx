import { getRefs } from '@/resources/refs.resource';

import Board from '@/components/Board/Board';
import { Suspense } from 'react';

const Home = () => {
  const refs = getRefs();

  return (
    <Suspense fallback={<div>loading...</div>}>
      <Board collection="all" refs={refs} />
    </Suspense>
  );
};

export default Home;
