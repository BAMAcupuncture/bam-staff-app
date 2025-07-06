import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Tasks', path: '/tasks' },
  { name: 'Goals', path: '/goals' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Team', path: '/team' },
];

const Navigation: React.FC = () => {
  const activeLinkClass = "bg-blue-100 text-blue-700";
  const inactiveLinkClass = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  return (
    <aside className="w-64 bg-white p-4 border-r">
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end // Use 'end' for the Dashboard link to only match the exact path
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? activeLinkClass : inactiveLinkClass}`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Navigation;