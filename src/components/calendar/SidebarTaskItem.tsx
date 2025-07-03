import React from 'react';
import { CheckSquare, Clock, Flag, User, AlertCircle } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreOperations } from '../../hooks/useFirestore';
import { useNotification } from '../../context/NotificationContext';

interface SidebarTaskItemProps {
  task: Task;
  showAssignee?: boolean;
  showClaimButton?: boolean;
  compact?: boolean;
}

const SidebarTaskItem: React.FC<SidebarTaskItemProps> = ({ 
  task, 
  showAssignee = false, 
  showClaimButton = false,
  compact = false 
}) => {
  const { userProfile } = useAuth();
  const { updateDocument } = useFirestoreOperations('tasks');
  const { addNotification } = useNotification();

  const isCompleted = task.status === 'Completed';
  const isOverdue = isPast(task.dueDate) && !isCompleted;
  const isDueToday = isToday(task.dueDate);
  const isMyTask = task.assigneeId === userProfile?.id;
  const isUnassigned = !task.assigneeId;

  // Handle task completion toggle
  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const newStatus = isCompleted ? 'Not Started' : 'Completed';
      await updateDocument(task.id, {
        status: newStatus,
        completedDate: newStatus === 'Completed' ? new Date() : null,
        completedBy: newStatus === 'Completed' ? userProfile?.id : null
      });
      
      addNotification({
        type: 'success',
        title: 'Task Updated',
        message: `"${task.title}" marked as ${newStatus.toLowerCase()}.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update task status.'
      });
    }
  };

  // Handle claiming a task
  const handleClaimTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  // Get priority color classes
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color classes
  const getStatusColor = () => {
    switch (task.status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Not Started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get container styling based on task state
  const getContainerClasses = () => {
    let baseClasses = 'rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group';
    
    if (isCompleted) {
      return `${baseClasses} bg-green-50 border-green-200 opacity-75`;
    } else if (isOverdue) {
      return `${baseClasses} bg-red-50 border-red-200 shadow-sm`;
    } else if (isDueToday) {
      return `${baseClasses} bg-orange-50 border-orange-200 shadow-sm`;
    } else if (isUnassigned) {
      return `${baseClasses} bg-blue-50 border-blue-200 hover:border-blue-300`;
    } else {
      return `${baseClasses} bg-white border-gray-200 hover:border-blue-300`;
    }
  };

  return (
    <div className={`${getContainerClasses()} ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex items-start space-x-3">
        {/* Checkbox for assigned tasks */}
        {isMyTask && (
          <button
            onClick={handleToggleComplete}
            className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && <CheckSquare className="h-3 w-3" />}
          </button>
        )}

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {/* Task title */}
          <h4 className={`font-medium transition-all duration-200 ${
            compact ? 'text-sm' : 'text-sm'
          } ${
            isCompleted 
              ? 'line-through text-gray-500' 
              : 'text-gray-900 group-hover:text-blue-900'
          }`}>
            {task.title}
          </h4>

          {/* Task description (if not compact and exists) */}
          {!compact && task.description && (
            <p className={`text-xs text-gray-600 mt-1 line-clamp-2 ${
              isCompleted ? 'opacity-60' : ''
            }`}>
              {task.description}
            </p>
          )}

          {/* Task metadata */}
          <div className={`flex items-center flex-wrap gap-2 ${compact ? 'mt-1' : 'mt-2'}`}>
            {/* Priority badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor()}`}>
              {task.priority}
            </span>

            {/* Status badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
              {task.status}
            </span>

            {/* Overdue indicator */}
            {isOverdue && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="h-3 w-3" />
                <span>Overdue</span>
              </span>
            )}

            {/* Due today indicator */}
            {isDueToday && !isOverdue && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                <Clock className="h-3 w-3" />
                <span>Due Today</span>
              </span>
            )}
          </div>

          {/* Assignee info (if requested) */}
          {showAssignee && (
            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>{isUnassigned ? 'Unassigned' : 'Assigned'}</span>
            </div>
          )}

          {/* Claim button for unassigned tasks */}
          {showClaimButton && isUnassigned && (
            <button
              onClick={handleClaimTask}
              className="mt-2 inline-flex items-center space-x-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <User className="h-3 w-3" />
              <span>Claim Task</span>
            </button>
          )}
        </div>

        {/* Priority flag indicator */}
        {task.priority === 'High' && !compact && (
          <div className="flex-shrink-0 mt-1">
            <Flag className="h-4 w-4 text-red-500" title="High Priority" />
          </div>
        )}
      </div>

      {/* Progress indicator for tasks with action steps */}
      {!compact && task.actionSteps && task.actionSteps.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Action Steps</span>
            <span>
              {task.actionSteps.filter(step => step.completed).length} / {task.actionSteps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ 
                width: `${(task.actionSteps.filter(step => step.completed).length / task.actionSteps.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-2 right-2">
        {isMyTask && !isCompleted && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleToggleComplete}
              className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
              title="Mark as complete"
            >
              <CheckSquare className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarTaskItem;