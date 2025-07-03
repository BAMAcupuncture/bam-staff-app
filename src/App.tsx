import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Import all application components EXCEPT TodoView
import LoginPage from './components/auth/LoginPage';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import DashboardView from './components/dashboard/DashboardView';
import CalendarView from './components/calendar/CalendarView';
import GoalsView from './components/goals/GoalsView';
import TeamView from './components/team/TeamView';
import ProfileSetup from './components/ProfileSetup';
import NotificationToast from './components/ui/NotificationToast';

// ==================================================================
// DEFINING TodoView DIRECTLY IN THIS FILE TO AVOID IMPORT ERRORS
// ==================================================================
const TodoView: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">To-Do Center</h1>
      <p className="text-gray-600 mt-2">This feature is under construction.</p>
    </div>
  );
};
// ==================================================================

const AppLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile) return <ProfileSetup />;

  // The corrected structure stacks everything vertically
  return (
    <div>
      <Header />
      <Navigation />
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardView />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/goals" element={<GoalsView />} />
              <Route path="/team" element={<TeamView />} />
              {/* This now uses the TodoView defined inside this file */}
              <Route path="/todo" element={<TodoView />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;