import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { NoteRef, Ref } from '@/lib/types';
import { invoke } from '@tauri-apps/api/core';
import { getUpdatedAtTimestamp } from '@/lib/helper';

export interface RootState {
  ref: Ref[];
  addRef: (ref: Ref) => void;
  deleteRef: (id: string) => void;
  mutateTag: (id: string, tags: string, type: 'add' | 'remove') => void;
  mutateName: (id: string, name: string) => void;
  mutateNote: (id: string, note: string) => void;
  mutateNoteText: (id: string, note: string) => void;
}

const Context = createContext<RootState | undefined>(undefined);

export const RefProvider: React.FC = ({ children }: PropsWithChildren) => {
  const [ref, setRef] = useState<Ref[]>([]);

  const fetchRefs = async () => {
    try {
      let data: Ref[] = await invoke('get_all_refs');
      data = data.sort((a, b) => {
        const aUpdatedAt = getUpdatedAtTimestamp(a);
        const bUpdatedAt = getUpdatedAtTimestamp(b);
        return bUpdatedAt - aUpdatedAt;
      });

      setRef(data);
    } catch (e) {
      throw new Error('Failed to fetch refs at RefProvider fetchRef');
    }
  };

  useEffect(() => {
    fetchRefs();
  }, []);

  const mutateTag = (id: string, tagname: string, type: string) => {
    setRef((prev) =>
      prev.map((meta) => {
        if (meta.metadata.id !== id) return meta;
        const tags = meta.metadata.tags ? [...meta.metadata.tags] : [];
        if (type === 'add') tags.push(tagname);
        if (type === 'remove') {
          const index = tags.indexOf(tagname);
          if (index !== -1) tags.splice(index, 1);
        }
        return { ...meta, metadata: { ...meta.metadata, tags } } as Ref;
      }),
    );
  };

  const addRef = (r: Ref) => {
    setRef((prev) => [r, ...prev]);
  };

  const mutateName = (id: string, name: string) => {
    setRef((prev) =>
      prev.map((m) => {
        if (m.metadata.id !== id) return m;

        // Type-safe update by preserving the original structure
        return {
          ...m,
          metadata: {
            ...m.metadata,
            name
          }
        } as Ref;
      })
    );
  };

  const deleteRef = (id: string) => {
    setRef((prev) => prev.filter((r) => r.metadata.id !== id));
  };

  const mutateNote = (id: string, note: string) => {
    setRef((prev) =>
      prev.map((meta) => {
        if (meta.metadata.id !== id) return meta;
        if (meta.metadata.ref_type === 'note') {
          return { ...(meta as NoteRef), content: note } as Ref;
        }
        return meta;
      }),
    );
  };

  const mutateNoteText = (id: string, note: string) => {
    setRef((prev) =>
      prev.map((m) => {
        if (m.metadata.id !== id) return m;

        return {
          ...m,
          metadata: {
            ...m.metadata,
            note_text: note
          }
        } as Ref;
      })
    );
  };

  const rootState: RootState = {
    ref,
    addRef,
    deleteRef,
    mutateTag,
    mutateName,
    mutateNote,
    mutateNoteText,
  };

  return <Context.Provider value={rootState}>{children}</Context.Provider>;
};

export const useRefSelector = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useRefSelector must be used within RefProvider');
  return ctx;
};
