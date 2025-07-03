import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Target, Calendar, Flag, User, CheckSquare, Clock } from 'lucide-react';
import useCollection from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Goal, Task, TeamMember } from '../../types';
import { format, isPast, isToday } from 'date-fns';
import GoalModal from './GoalModal';
import TaskModal from '../tasks/TaskModal';

// Reuse the progress indicator from GoalCard
const GoalProgressIndicator: React.FC<{ goal: Goal; showDetails?: boolean }> = ({ goal, showDetails = false }) => {
  const { progress, createdDate, targetDate, status } = goal;

  if (status !== 'active') {
    return (
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    );
  }

  if (!targetDate) {
    return (
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(0, Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const expectedProgress = Math.min(Math.round((daysPassed / totalDays) * 100), 100);
  
  const variance = progress - expectedProgress;
  const isOverdue = isPast(targetDate) && progress < 100;

  let statusText = 'On Target';
  let statusColor = 'bg-green-500';

  if (isOverdue) {
    statusText = 'Overdue';
    statusColor = 'bg-red-500';
  } else if (variance < -25) {
    statusText = 'Behind Schedule';
    statusColor = 'bg-red-500';
  } else if (variance < -10) {
    statusText = 'At Risk';
    statusColor = 'bg-yellow-500';
  } else if (variance > 15) {
    statusText = 'Ahead of Schedule';
    statusColor = 'bg-green-500';
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-lg font-bold text-gray-900">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
          <span className="text-sm font-medium text-gray-700">{statusText}</span>
        </div>
        {showDetails && (
          <span className="text-xs text-gray-500">Expected: {expectedProgress}%</span>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>Days elapsed: {daysPassed} of {totalDays}</p>
          {isOverdue && <p className="text-red-600 font-medium">Goal is past due date</p>}
        </div>
      )}
    </div>
  );
};

const TaskItem: React.FC<{
  task: Task;
  teamMembers: TeamMember[];
  onEdit: (task: Task) => void;
}> = ({ task, teamMembers, onEdit }) => {
  const { userProfile } = useAuth();
  const { updateDocument } = useFirestoreOperations('tasks');
  const { addNotification } = useNotification();

  const assignee = teamMembers.find(member => member.id === task.assigneeId);
  const isCompleted = task.status === 'Completed';
  const isOverdue = isPast(task.dueDate) && !isCompleted;
  const isDueToday = isToday(task.dueDate);

  const handleToggleComplete = async () => {
    try {
      const newStatus = isCompleted ? 'Not Started' : 'Completed';
      await updateDocument(task.id, {
        status: newStatus,
        completedDate: isCompleted ? null : new Date(),
        completedBy: isCompleted ? null : userProfile?.id
      });
      
      addNotification({
        type: 'success',
        title: 'Task Updated',
        message: `Task "${task.title}" marked as ${newStatus.toLowerCase()}.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task status.'
      });
    }
  };

  const handleClaimTask = async () => {
    if (!userProfile) return;
    
    try {
      await updateDocument(task.id, {
        assigneeId: userProfile.id,
        status: 'In Progress'
      });
      
      addNotification({
        type: 'success',
        title: 'Task Claimed',
        message: `You have claimed "${task.title}".`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Claim Failed',
        message: 'Failed to claim task.'
      });
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isCompleted ? 'bg-gray-50 border-gray-200 opacity-75' : 
      isOverdue ? 'bg-red-50 border-red-200' :
      isDueToday ? 'bg-yellow-50 border-yellow-200' :
      'bg-white border-gray-200 hover:border-blue-300'
    }`}>
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {isCompleted && <CheckSquare className="h-3 w-3" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due: {format(task.dueDate, 'MMM d, yyyy')}
                  </span>
                  {isOverdue && <span className="text-red-600 font-medium">(Overdue)</span>}
                  {isDueToday && !isOverdue && <span className="text-orange-600 font-medium">(Due Today)</span>}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Flag className="h-4 w-4" />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit task"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Assignee */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              {task.assigneeId ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{assignee?.name || 'Unknown User'}</span>
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {assignee?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClaimTask}
                  className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                >
                  Claim Task
                </button>
              )}
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              task.status === 'Completed' ? 'bg-green-100 text-green-800' :
              task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalDetailView: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals');
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: teamMembers, loading: teamLoading } = useCollection<TeamMember>('team');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (goalsLoading || tasksLoading || teamLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const goal = goals.find(g => g.id === goalId);
  
  if (!goal) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Goal not found</h2>
          <p className="text-gray-600 mb-4">The goal you're looking for doesn't exist or may have been deleted.</p>
          <Link 
            to="/goals" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Goals</span>
          </Link>
        </div>
      </div>
    );
  }

  // Filter tasks for this specific goal
  const linkedTasks = tasks.filter(task => task.goalId === goal.id);
  
  // Filter logic: Hide completed tasks if goal's target date has passed and goal is completed
  const isGoalPastDue = goal.targetDate ? isPast(goal.targetDate) : false;
  const shouldHideCompleted = isGoalPastDue && goal.status === 'completed';
  
  const visibleTasks = linkedTasks.filter(task => 
    !shouldHideCompleted || task.status !== 'Completed'
  );

  // Sort tasks: Incomplete first, then by priority, then by due date
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
    
    // Then by priority
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    // Then by due date
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const completedTasksCount = linkedTasks.filter(t => t.status === 'Completed').length;
  const totalTasksCount = linkedTasks.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/goals" 
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Goals</span>
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
                  <p className="text-gray-600 capitalize">{goal.type} Goal</p>
                </div>
              </div>
              
              {goal.targetDate && (
                <div className="flex items-center space-x-2 text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Target Date: {format(goal.targetDate, 'MMMM dd, yyyy')}</span>
                  {isPast(goal.targetDate) && goal.status === 'active' && (
                    <span className="text-red-600 font-medium">(Overdue)</span>
                  )}
                </div>
              )}
              
              <p className="text-gray-700 mb-6">{goal.description}</p>
            </div>
            
            <button
              onClick={() => setShowGoalModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Goal</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GoalProgressIndicator goal={goal} showDetails={true} />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Goal Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{totalTasksCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{completedTasksCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-blue-600">{totalTasksCount - completedTasksCount}</span>
                </div>
                {goal.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-xs">Notes:</span>
                    <p className="text-gray-700 text-sm mt-1">{goal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Linked Tasks</h2>
            <p className="text-gray-600 text-sm">
              {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''} linked to this goal
            </p>
          </div>
          
          <button
            onClick={handleAddTask}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
        
        <div className="p-6">
          {sortedTasks.length > 0 ? (
            <div className="space-y-4">
              {sortedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task}
                  teamMembers={teamMembers}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks linked yet</h3>
              <p className="text-gray-600 mb-4">
                Start by adding tasks that will help you achieve this goal.
              </p>
              <button
                onClick={handleAddTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Your First Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          goal={goal}
          onClose={() => setShowGoalModal(false)}
          onSuccess={() => setShowGoalModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          goalId={goal.id}
          teamMembers={teamMembers}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default GoalDetailView;