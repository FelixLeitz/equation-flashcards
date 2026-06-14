import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth, RedirectIfAuth } from '@/features/auth/guards.jsx';
import { AppShell } from '@/components/AppShell.jsx';
import LandingPage from '@/pages/LandingPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import LoginPage from '@/features/auth/LoginPage.jsx';
import SignUpPage from '@/features/auth/SignUpPage.jsx';
import DeckListPage from '@/features/decks/DeckListPage.jsx';
import DeckDetailPage from '@/features/decks/DeckDetailPage.jsx';
import StudyMode from '@/features/study/StudyMode.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },

  // Public auth routes (redirect away if already logged in).
  {
    element: <RedirectIfAuth />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> }
    ]
  },

  // Protected app routes, wrapped in the authenticated shell.
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/decks', element: <DeckListPage /> },
          { path: '/decks/:id', element: <DeckDetailPage /> }
        ]
      },
      // Study mode is full-screen (no shell chrome).
      { path: '/decks/:id/study', element: <StudyMode /> }
    ]
  },

  { path: '*', element: <NotFoundPage /> }
]);
