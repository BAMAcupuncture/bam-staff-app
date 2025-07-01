// src/components/goals/GoalCard.tsx
import React from 'react';
import { Goal, Task } from '../../types';
import { differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// A dedicated component for the progress indicator
const GoalProgressIndicator: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { progress, createdDate, targetDate, status } = goal;

  if (status !== 'active' || !targetDate) {
    return <div className="text-sm text-gray-500 capitalize">{status}</div>;
  }

  const today = new Date();
  const totalDays = differenceInDays(targetDate, createdDate);
  const daysPassed = differenceInDays(today, createdDate);

  // Avoid division by zero and handle future goals
  const expectedProgress = totalDays > 0 ? Math.min(Math.round((daysPassed / totalDays) * 100), 100) : 0;
  
  const variance = progress - expectedProgress;

  let statusText = 'On Target';
  let statusColor = 'bg-green-500';

  if (variance < -25) {
    statusText = 'Behind';
    statusColor = 'bg-red-500';
  } else if (variance < 0) {
    statusText = 'At Risk';
    statusColor = 'bg-yellow-500';
  }

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex items-center mt-2">
        <div className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></div>
        <span className="text-sm text-gray-600">{statusText}</span>
        <span className="text-xs text-gray-400 ml-1">(Expected: {expectedProgress}%)</span>
      </div>
    </div>
  );
};

interface GoalCardProps {
  goal: Goal;
  tasks: Task[];
  onSelectGoal: (goalId: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, tasks, onSelectGoal }) => {
  const navigate = useNavigate();
  const tasksForThisGoal = tasks.filter(task => task.goalId === goal.id);
  const completedTasks = tasksForThisGoal.filter(task => task.status === 'Completed').length;

  const handleCardClick = (e: React.MouseEvent) => {
    // Check if the click was on the edit button area
    const target = e.target as HTMLElement;
    if (target.closest('.edit-button')) {
      e.stopPropagation();
      onSelectGoal(goal.id);
      return;
    }
    
    // Navigate to detail view
    navigate(`/goal/${goal.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectGoal(goal.id);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Edit Button */}
      <button
        onClick={handleEditClick}
        className="edit-button absolute top-4 right-4 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Edit goal"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      <div className="flex justify-between items-start pr-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
          <p className="text-sm text-gray-500 capitalize">{goal.type} Goal</p>
        </div>
        {goal.targetDate && (
          <span className="text-sm text-gray-600">
            Due: {format(goal.targetDate, 'MMM dd, yyyy')}
          </span>
        )}
      </div>

      <p className="text-gray-700 my-4 line-clamp-2">{goal.description}</p>
      
      <GoalProgressIndicator goal={goal} />

      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-800">Linked Tasks</h4>
        {tasksForThisGoal.length > 0 ? (
           <p className="text-sm text-gray-600">{completedTasks} of {tasksForThisGoal.length} tasks completed.</p>
        ) : (
          <p className="text-sm text-gray-500 italic">No tasks linked to this goal yet.</p>
        )}
      </div>
    </div>
  );
};

export default GoalCard;