import React from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { Goal, Task, TeamMember } from '../../types';
import { differenceInDays } from 'date-fns';
import PerformanceScorecard from './PerformanceScorecard';

// --- Reusable Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}
const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
  };
  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
};

// --- Main Analytics View Component ---
const AnalyticsView: React.FC = () => {
  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals');
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: team, loading: teamLoading } = useCollection<TeamMember>('team');

  if (goalsLoading || tasksLoading || teamLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // --- 1. Goal Health Calculation ---
  const activeGoals = goals.filter(g => g.status === 'active' && g.targetDate);
  const goalHealth = activeGoals.reduce(
    (acc, goal) => {
      const today = new Date();
      const totalDays = differenceInDays(goal.targetDate!, goal.createdDate);
      const daysPassed = differenceInDays(today, goal.createdDate);
      const expectedProgress = totalDays > 0 ? Math.min(Math.round((daysPassed / totalDays) * 100), 100) : 0;
      const variance = goal.progress - expectedProgress;

      if (variance < -25) acc.behind += 1;
      else if (variance < 0) acc.atRisk += 1;
      else acc.onTarget += 1;
      
      return acc;
    },
    { onTarget: 0, atRisk: 0, behind: 0 }
  );

  // --- 2. Team Workload Calculation ---
  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const workload = team
    .filter(m => m.status === 'active')
    .map(member => ({
      name: member.name,
      taskCount: activeTasks.filter(task => task.assigneeId === member.id).length,
    }))
    .sort((a, b) => b.taskCount - a.taskCount);

  // --- 3. Overall Statistics ---
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const activeTeamMembers = team.filter(m => m.status === 'active').length;
  const overdueTasks = tasks.filter(t => t.dueDate < new Date() && t.status !== 'Completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive insights into your team's performance and goal progress</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Goals" value={totalGoals} color="blue" />
        <StatCard title="Completed Goals" value={completedGoals} color="green" />
        <StatCard title="Active Team Members" value={activeTeamMembers} color="blue" />
        <StatCard title="Overdue Tasks" value={overdueTasks} color="red" />
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Tasks" value={totalTasks} color="blue" />
        <StatCard title="Completed Tasks" value={completedTasks} color="green" />
        <StatCard 
          title="Task Completion Rate" 
          value={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%'} 
          color={totalTasks > 0 && (completedTasks / totalTasks) > 0.7 ? 'green' : 'yellow'} 
        />
      </div>

      {/* Goal Health Overview Widget */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Goal Health Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="On Target" value={goalHealth.onTarget} color="green" />
          <StatCard title="At Risk" value={goalHealth.atRisk} color="yellow" />
          <StatCard title="Behind" value={goalHealth.behind} color="red" />
        </div>
        
        {activeGoals.length === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-center">No active goals with target dates to analyze</p>
          </div>
        )}
      </div>

      {/* Performance Scorecard Widget */}
      <PerformanceScorecard tasks={tasks} team={team} />

      {/* Team Workload Widget */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Task Load per Team Member</h2>
        {workload.length > 0 ? (
          <div className="space-y-3">
            {workload.map(member => (
              <div key={member.name} className="flex items-center">
                <span className="w-32 font-medium text-gray-700 text-sm">{member.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                  <div 
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-start pl-3 transition-all duration-300"
                    style={{ width: `${Math.max(10, Math.min(100, member.taskCount * 15))}%` }}
                  >
                    <span className="font-bold text-white text-sm">{member.taskCount}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-16 text-right">
                  {member.taskCount} task{member.taskCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-center">No active team members with assigned tasks</p>
          </div>
        )}
      </div>

      {/* Goal Progress Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Goal Progress Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const linkedTasksCount = tasks.filter(t => t.goalId === goal.id).length;
            const completedLinkedTasks = tasks.filter(t => t.goalId === goal.id && t.status === 'Completed').length;
            
            return (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 truncate" title={goal.title}>
                  {goal.title}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tasks: {completedLinkedTasks}/{linkedTasksCount}</span>
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                      goal.status === 'active' ? 'bg-green-100 text-green-800' :
                      goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {goals.length === 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-center">No goals created yet</p>
          </div>
        )}
      </div>

      {/* Summary Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Performance Highlights</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{completedGoals} of {totalGoals} goals completed ({totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{completedTasks} of {totalTasks} tasks completed ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{activeTeamMembers} active team members</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Areas for Attention</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {overdueTasks > 0 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{overdueTasks} overdue task{overdueTasks !== 1 ? 's' : ''} need attention</span>
                </li>
              )}
              {goalHealth.behind > 0 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{goalHealth.behind} goal{goalHealth.behind !== 1 ? 's' : ''} behind schedule</span>
                </li>
              )}
              {goalHealth.atRisk > 0 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>{goalHealth.atRisk} goal{goalHealth.atRisk !== 1 ? 's' : ''} at risk</span>
                </li>
              )}
              {overdueTasks === 0 && goalHealth.behind === 0 && goalHealth.atRisk === 0 && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All goals and tasks are on track!</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;