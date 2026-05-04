import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for navigating to the viewer with proper back navigation.
 * Stores the current route as origin so the back button returns to the correct page.
 */
export const useViewerNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToViewer = useCallback(
    (refId: string) => {
      navigate(`/viewer/${refId}`, {
        state: { from: location.pathname },
      });
    },
    [navigate, location.pathname],
  );

  return navigateToViewer;
};
