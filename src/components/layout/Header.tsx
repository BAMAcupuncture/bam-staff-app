import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

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
            <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 hover:bg-gray-700" title="Log Out">
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;