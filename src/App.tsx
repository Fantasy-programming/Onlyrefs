import { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { WindowDecoration } from './components/WindowDecoration';
import { LeftSidebar } from './components/Layout/LeftSidebar';
import {
  LeftSidebarProvider,
  useLeftSidebar,
} from './components/Layout/LeftSidebarContext';
import { DetailsPanel } from './components/Layout/DetailsPanel';
import { useDetailsPanel } from './components/Layout/DetailsPanelContext';
import { SelectionActionBar } from './components/SelectionActionBar/SelectionActionBar';
import { cn } from './lib/utils';

const AppContent = (props: PropsWithChildren) => {
  const { isOpen } = useDetailsPanel();
  const { isVisible: leftSidebarVisible } = useLeftSidebar();
  const location = useLocation();

  // Hide details panel on certain pages
  const hideDetailsPanel =
    location.pathname.startsWith('/boards/') ||
    location.pathname === '/settings' ||
    location.pathname === '/canvas' ||
    location.pathname.startsWith('/canvas/') ||
    location.pathname.startsWith('/viewer/');

  // Hide left sidebar on certain pages
  const hideLeftSidebar =
    location.pathname.startsWith('/boards/') ||
    location.pathname.startsWith('/canvas/') ||
    location.pathname.startsWith('/viewer/');

  const showDetailsPanel = isOpen && !hideDetailsPanel;
  const showLeftSidebar = leftSidebarVisible && !hideLeftSidebar;

  return (
    <div className="bg-background text-foreground h-screen selection:bg-blue-500/30">
      <WindowDecoration />

      {/* Left Sidebar */}
      {showLeftSidebar && <LeftSidebar />}

      {/* Main Content Area */}
      <main
        className={cn(
          'h-full pt-0 font-sans transition-[margin] duration-200',
          showLeftSidebar ? 'ml-[220px]' : 'ml-0',
          showDetailsPanel ? 'mr-[240px]' : 'mr-0',
        )}
      >
        <div className="h-full overflow-hidden">{props.children}</div>
      </main>

      {/* Right Details Panel */}
      {!hideDetailsPanel && <DetailsPanel />}

      {/* Selection Action Bar - floating at bottom */}
      <SelectionActionBar />
    </div>
  );
};

const App = (props: PropsWithChildren) => {
  return (
    <LeftSidebarProvider>
      <AppContent {...props} />
    </LeftSidebarProvider>
  );
};

export default App;
