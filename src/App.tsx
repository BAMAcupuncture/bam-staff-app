import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';
import SystemAdminRoute from './components/auth/SystemAdminRoute';

import DashboardView from './components/dashboard/DashboardView';
import GoalsView from './components/goals/GoalsView.tsx/index.ts';
import TasksView from './components/tasks/TasksView';
import TodoView from './components/todos/TodoView';
import TeamView from './components/team/TeamView';
import CalendarView from './components/calendar/CalendarView';
import ProfileSetup from './components/auth/ProfileSetup.tsx/index.ts';
import ProfilePage from './components/auth/ProfilePage';
import SystemPanel from './components/system/SystemPanel';

import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />

            {/* Protected routes check both Firebase auth and Firestore profile */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardView />} />
              <Route path="/goals" element={<GoalsView />} />
              <Route path="/tasks" element={<TasksView />} />
              <Route path="/todos" element={<TodoView />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/team" element={<TeamView />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* System admin routes for the user with isSystemAccount=true */}
              <Route element={<SystemAdminRoute />}>
                <Route path="/system-panel" element={<SystemPanel />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;