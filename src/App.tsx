import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth } from './config/firebase'; // We need auth for the logout button
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

// --- Re-usable Components ---
const AppLoader: React.FC = () => <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
const ProfileSetup: React.FC = () => <div className="p-8"><h2>Profile Setup Required</h2><p>Please contact an administrator to create your team profile.</p></div>;

// --- Layout Components ---
const Header: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">BAM Task App</Link>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">{userProfile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 hover:text-gray-700" title="Log Out"><LogOut size={24} /></button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Navigation: React.FC = () => (
  <nav className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex space-x-8">
        <Link to="/" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Dashboard</Link>
        <Link to="/tasks" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Tasks</Link>
        <Link to="/goals" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Goals</Link>
        <Link to="/calendar" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Calendar</Link>
        <Link to="/team" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Team</Link>
      </div>
    </div>
  </nav>
);

const ProtectedRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile) return <ProfileSetup />;
  return (
    <div><Header /><Navigation /><main className="p-8"><Outlet /></main></div>
  );
};

// --- Page-level View Components ---
const DashboardView: React.FC = () => <div><h1 className="text-3xl font-bold">Dashboard</h1><p>Welcome to your dashboard.</p></div>;
const TasksView: React.FC = () => <div><h1 className="text-3xl font-bold">Tasks</h1><p>Task list coming soon.</p></div>;
const GoalsView: React.FC = () => <div><h1 className="text-3xl font-bold">Goals</h1><p>Goals page coming soon.</p></div>;
const CalendarView: React.FC = () => <div><h1 className="text-3xl font-bold">Calendar</h1><p>Calendar view coming soon.</p></div>;
const TeamView: React.FC = () => <div><h1 className="text-3xl font-bold">Team</h1><p>Team management page coming soon.</p></div>;
const LoginPage: React.FC = () => { /* ... You can copy the LoginPage code here if needed, or we can build it next ... */ return <div>LoginPage</div>};


// --- The Main App Component ---
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