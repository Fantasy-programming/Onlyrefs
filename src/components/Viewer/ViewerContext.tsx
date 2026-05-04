import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Ref } from '@/lib/types';

interface ViewerContextType {
  isOpen: boolean;
  currentRef: Ref | null;
  openViewer: (ref: Ref) => void;
  closeViewer: () => void;
}

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context;
};

interface ViewerProviderProps {
  children: ReactNode;
}

export const ViewerProvider: React.FC<ViewerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRef, setCurrentRef] = useState<Ref | null>(null);

  const openViewer = useCallback((ref: Ref) => {
    setCurrentRef(ref);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    // Delay clearing the ref to allow for exit animation
    setTimeout(() => setCurrentRef(null), 300);
  }, []);

  return (
    <ViewerContext.Provider
      value={{ isOpen, currentRef, openViewer, closeViewer }}
    >
      {children}
    </ViewerContext.Provider>
  );
};
