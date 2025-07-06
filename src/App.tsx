import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import all the component files
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import LoginPage from './components/auth/LoginPage';
import DashboardView from './components/dashboard/DashboardView';
// We will create the actual pages later. For now, they are simple placeholders.
const TasksView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Tasks</h1></div>;
const GoalsView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Goals</h1></div>;
const CalendarView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Calendar</h1></div>;
const TeamView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Team</h1></div>;
const ProfileSetup: React.FC = () => <div className="p-8"><h2>Profile Setup Required</h2><p>Please contact an administrator to create your team profile.</p></div>;
const AppLoader: React.FC = () => <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;

// This component protects routes that require authentication
const ProtectedRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <ProfileSetup />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/goals" element={<GoalsView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/team" element={<TeamView />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;