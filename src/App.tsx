import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import all our page components from their new files
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import DashboardView from './components/dashboard/DashboardView';
import TasksView from './components/tasks/TasksView';
import GoalsView from './components/goals/GoalsView'; // The important import

// Placeholders for pages we haven't built out yet
const CalendarView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Calendar</h1></div>;
const TeamView: React.FC = () => <div className="p-4"><h1 className="text-2xl font-bold">Team</h1></div>;


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