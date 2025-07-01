import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  CheckSquare, 
  Calendar, 
  Target, 
  Users, 
  BarChart3,
  ClipboardList,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navigation: React.FC = () => {
  const { userProfile } = useAuth();

  const navigationItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/todo', label: 'To-Do Lists', icon: ClipboardList },
    { to: '/team', label: 'Team', icon: Users },
  ];

  // Add analytics for admins only
  if (userProfile?.role === 'Admin') {
    navigationItems.push({ to: '/analytics', label: 'Analytics', icon: BarChart3 });
  }

  // Add system panel for system accounts only
  if (userProfile?.isSystemAccount) {
    navigationItems.push({ to: '/system', label: 'System', icon: Shield });
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.label === 'System' && (
                  <div className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    SYS
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;