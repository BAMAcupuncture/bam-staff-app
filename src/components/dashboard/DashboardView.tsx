import React from 'react';
import useCollection from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { Task, TeamMember, Goal } from '../../types';
import { CheckSquare, Calendar, Target, Users } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const DashboardView: React.FC = () => {
  // --- Start of Debugging Code ---
  console.log('DashboardView: Component is rendering...');

  const { userProfile } = useAuth();
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals');
  const { data: team, loading: teamLoading } = useCollection<TeamMember>('team');
  
  console.log('DashboardView: Data from hooks:', { tasks, goals, team, userProfile });

  const loading = tasksLoading || goalsLoading || teamLoading;

  // This is a "guard clause" to prevent the error.
  // If any of these lists are not yet available, we show a loading screen.
  if (loading || !tasks || !goals || !team) {
    console.log('DashboardView: Data is loading or not available yet. Showing loader.');
    return <div>Loading dashboard data...</div>;
  }
  
  console.log('DashboardView: Data is loaded. Proceeding to render.');
  // --- End of Debugging Code ---

  const userTasks = tasks.filter(task => task.assigneeId === userProfile?.uid);
  const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
  const activeGoals = goals.filter(goal => goal.status === 'active').length;
  const activeTeamMembers = team.filter(member => member.status === 'active').length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome, {userProfile?.name}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Your Open Tasks" value={userTasks.length - completedTasks} icon={<CheckSquare />} />
        <StatCard title="Tasks Completed" value={completedTasks} icon={<Calendar />} />
        <StatCard title="Active Goals" value={activeGoals} icon={<Target />} />
        <StatCard title="Active Team Members" value={activeTeamMembers} icon={<Users />} />
      </div>
    </div>
  );
};

export default DashboardView;