import service from '~/services/refs.service';
import { createResource } from 'solid-js';
import { Ref } from '~/lib/types';

const [refs] = createResource<Ref[]>(service.getRefs);

export const getRefs = () => {
  return refs;
};
