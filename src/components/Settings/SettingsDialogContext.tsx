import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsDialogContextType {
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

const SettingsDialogContext = createContext<
  SettingsDialogContextType | undefined
>(undefined);

export const SettingsDialogProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSettings = () => setIsOpen(true);
  const closeSettings = () => setIsOpen(false);
  const toggleSettings = () => setIsOpen((prev) => !prev);

  // Keyboard shortcut: Ctrl+, (or Cmd+, on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SettingsDialogContext.Provider
      value={{
        isOpen,
        openSettings,
        closeSettings,
        toggleSettings,
      }}
    >
      {children}
    </SettingsDialogContext.Provider>
  );
};

export const useSettingsDialog = (): SettingsDialogContextType => {
  const context = useContext(SettingsDialogContext);
  if (!context) {
    throw new Error(
      'useSettingsDialog must be used within a SettingsDialogProvider',
    );
  }
  return context;
};

export default SettingsDialogContext;
