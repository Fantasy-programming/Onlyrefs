import React from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  RouteObject,
} from 'react-router-dom';

import Home from './home/Home.tsx';
import Boards from './boards/Boards.tsx';
import Settings from './settings/Settings.tsx';
import { AppLayout } from './layout.tsx';

const Routes: React.FC = () => {
  const approutes: RouteObject[] = [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <div>ahahaha</div>,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: 'boards',
          element: <Boards />,
          children: [
            {
              path: ':id',
              element: <Boards />,
            },
          ],
        },
        {
          path: 'settings',
          element: <Settings />,
        },
      ],
    },
  ];

  const router = createBrowserRouter([...approutes]);

  return <RouterProvider router={router} />;
};

export default Routes;
