import service from '@/services/refs.service';
import { createResource } from 'solid-js';
import { createDeepSignal } from '@solid-primitives/resource';
import { NoteRef, Ref } from '@/lib/types';

const [refs, { mutate }] = createResource<Ref[]>(service.getRefs, {
  storage: createDeepSignal,
});

export const getRefs = () => {
  return refs;
};

export const addRefs = (ref: Ref) => {
  mutate((oldRefs) => {
    if (!oldRefs) return undefined;

    return [ref, ...oldRefs];
  });
};

export const mutateTag = (id: string, tagname: string, type: string) => {
  mutate((oldRefs) => {
    if (!oldRefs) return undefined;

    return oldRefs.map((ref) => {
      if (ref.metadata.id !== id) return ref;

      let updatedTags = [...(ref.metadata.tags || [])];

      if (type === 'add') {
        updatedTags.push(tagname);
      }

      if (type === 'remove') {
        updatedTags = updatedTags.filter((tag) => tag !== tagname);
      }
      return {
        ...ref,
        metadata: {
          ...ref.metadata,
          tags: updatedTags,
        },
      } as Ref;
    });
  });
};

export const deleteRef = (id: string) => {
  mutate((oldRefs) => {
    if (!oldRefs) return undefined;

    const updatedRefs = oldRefs.filter((ref) => ref.metadata.id !== id);
    return updatedRefs;
  });
};

export const mutateName = (id: string, name: string) => {
  mutate((oldRefs) => {
    if (!oldRefs) return undefined;

    return oldRefs.map((ref) => {
      if (ref.metadata.id !== id) return ref;

      return {
        ...ref,
        metadata: {
          ...ref.metadata,
          name: name,
        },
      } as Ref;
    });
  });
};

export const mutateNote = (id: string, note: string) => {
  mutate((oldRefs) => {
    if (!oldRefs) return oldRefs;

    return oldRefs.map((ref) => {
      if (ref.metadata.id === id && ref.metadata.ref_type === 'note') {
        return {
          ...ref,
          content: note,
        } as NoteRef;
      }
      return ref;
    });
  });
};

export const mutateNoteText = (id: string, note: string) => {
  mutate((oldRefs) => {
    if (!oldRefs) return oldRefs;

    return oldRefs.map((ref) => {
      if (ref.metadata.id === id) {
        return {
          ...ref,
          metadata: {
            ...ref.metadata,
            note_text: note,
          },
        } as NoteRef;
      }
      return ref;
    });
  });
};
