import React from 'react';
import { CheckSquare, Calendar, Target, Users, TrendingUp, Clock } from 'lucide-react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { Task, TeamMember, Goal } from '../../types';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

const DashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: tasks } = useCollection<Task>('tasks');
  const { data: teamMembers } = useCollection<TeamMember>('team');
  const { data: goals } = useCollection<Goal>('goals');

  // Calculate dashboard stats
  const myTasks = tasks.filter(task => task.assigneeId === userProfile?.id);
  const myIncompleteTasks = myTasks.filter(task => task.status !== 'Completed');
  const tasksToday = tasks.filter(task => isToday(task.dueDate));
  const tasksTomorrow = tasks.filter(task => isTomorrow(task.dueDate));
  const overdueTasks = tasks.filter(task => 
    task.dueDate < new Date() && task.status !== 'Completed'
  );

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const goalsDueForReview = activeGoals.filter(goal => 
    goal.nextReviewDate && goal.nextReviewDate <= new Date()
  );

  const isJonathan = userProfile?.name.toLowerCase().includes('jonathan');
  const isAdmin = userProfile?.role === 'Admin';

  const TaskList: React.FC<{
    title: string;
    tasks: Task[];
    emptyMessage: string;
  }> = ({ title, tasks, emptyMessage }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => {
              const assignee = teamMembers.find(m => m.id === task.assigneeId);
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <span>{format(task.dueDate, 'MMM d')}</span>
                      {assignee && <span>• {assignee.name}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </div>
                </div>
              );
            })}
            {tasks.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                And {tasks.length - 5} more...
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userProfile?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your tasks and goals today.
        </p>
      </div>

      {/* Quick Actions - Moved to top */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group">
            <CheckSquare className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">New Task</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 group">
            <Target className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">New Goal</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all duration-200 group">
            <Calendar className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">View Calendar</span>
          </button>
          
          {isAdmin && (
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all duration-200 group">
              <Users className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Manage Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Consolidated Overview Box */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{myIncompleteTasks.length}</div>
            <div className="text-sm font-medium text-gray-600">My Tasks</div>
            <div className="text-xs text-gray-500 mt-1">Incomplete tasks assigned to you</div>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{tasksToday.length}</div>
            <div className="text-sm font-medium text-gray-600">Due Today</div>
            <div className="text-xs text-gray-500 mt-1">Tasks due today</div>
          </div>
          
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{overdueTasks.length}</div>
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <div className="text-xs text-gray-500 mt-1">Tasks past their due date</div>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeGoals.length}</div>
            <div className="text-sm font-medium text-gray-600">Active Goals</div>
            <div className="text-xs text-gray-500 mt-1">{goalsDueForReview.length} due for review</div>
          </div>
        </div>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TaskList
          title="My Tasks"
          tasks={myIncompleteTasks}
          emptyMessage="No tasks assigned to you"
        />
        
        <TaskList
          title="Due Today"
          tasks={tasksToday}
          emptyMessage="No tasks due today"
        />
      </div>

      {/* Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TaskList
          title="Due Tomorrow"
          tasks={tasksTomorrow}
          emptyMessage="No tasks due tomorrow"
        />
        
        {overdueTasks.length > 0 && (
          <TaskList
            title="Overdue Tasks"
            tasks={overdueTasks}
            emptyMessage="No overdue tasks"
          />
        )}
      </div>

      {/* Welcome Message for New Users */}
      {tasks.length === 0 && goals.length === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome to BAM Acupuncture Task Management!</h3>
            <p className="text-blue-700 mb-4">
              Get started by creating your first task or goal. This dashboard will show your progress and upcoming deadlines.
            </p>
            <div className="space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Create Your First Task
              </button>
              <button className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
                Set Up Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;