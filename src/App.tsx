import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginPage from './components/auth/LoginPage';
import AdminRoute from './components/auth/AdminRoute';
import SystemAdminRoute from './components/auth/SystemAdminRoute';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import CalendarView from './components/calendar/CalendarView';
import DashboardView from './components/dashboard/DashboardView';
import TasksView from './components/tasks/TasksView';
import TeamView from './components/team/TeamView';
import GoalsView from './components/goals/GoalsView';
import GoalDetailView from './components/goals/GoalDetailView';
import AnalyticsView from './components/analytics/AnalyticsView';
import ToDoView from './components/todo/ToDoView';
import SystemPanel from './components/system/SystemPanel';
import ProfileSetup from './components/ProfileSetup';
import NotificationToast from './components/ui/NotificationToast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!userProfile) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Header />
              <Navigation />
              <main>
                <Routes>
                  {/* --- DEFAULT ROUTE --- */}
                  <Route path="/" element={<DashboardView />} />
                  
                  {/* --- MAIN APPLICATION ROUTES --- */}
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/tasks" element={<TasksView />} />
                  <Route path="/goals" element={<GoalsView />} />
                  <Route path="/goal/:goalId" element={<GoalDetailView />} />
                  <Route path="/todo" element={<ToDoView />} />
                  <Route path="/team" element={<TeamView />} />
                  
                  {/* Admin-only routes */}
                  <Route path="/analytics" element={
                    <AdminRoute showAccessDenied={true}>
                      <AnalyticsView />
                    </AdminRoute>
                  } />
                  
                  {/* System-only routes */}
                  <Route path="/system" element={
                    <SystemAdminRoute>
                      <SystemPanel />
                    </SystemAdminRoute>
                  } />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </ProtectedRoute>
          } />
        </Routes>
        <NotificationToast />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;