import React from 'react';
import useCollection from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { CheckSquare } from 'lucide-react';

const DashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: tasks, loading } = useCollection<Task>('tasks');

  if (loading) {
    return <div>Loading dashboard...</div>;
  }
  
  const userTasks = (tasks || []).filter(task => task.assigneeId === userProfile?.uid && task.status !== 'Completed');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome, {userProfile?.name}!</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-blue-500 mr-4"/>
            <div>
                <p className="text-sm text-gray-500">Your Open Tasks</p>
                <p className="text-2xl font-bold">{userTasks.length}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;