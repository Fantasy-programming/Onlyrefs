import service from '@/services/refs.service';
import { Ref } from '@/lib/types';

export const getRefs = async (): Promise<Ref[] | undefined> => {
  try {
    return await service.getRefs();
  } catch (e) {
    console.error('getRefs error', e);
    return undefined;
  }
};
