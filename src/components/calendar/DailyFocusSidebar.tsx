import React, { useMemo } from 'react';
import { format, isToday, isSameDay, isPast } from 'date-fns';
import { CheckSquare, Clock, User, Flag, Target, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { useNotifications } from '../../context/NotificationContext';
import { Task, Goal } from '../../types';

interface SidebarProps {
  selectedDate: Date;
  onAddTask: () => void;
}

const DailyFocusSidebar: React.FC<SidebarProps> = ({ 
  selectedDate, 
  onAddTask 
}) => {
  const { userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { updateDocument } = useFirestoreOperations('tasks');
  const { 
    getEventsForDate, 
    getOverdueItems, 
    getUpcomingEvents,
    teamMembers 
  } = useCalendarEvents();

  // Get events for the selected date
  const dayEvents = getEventsForDate(selectedDate);
  const overdueItems = getOverdueItems();
  const upcomingEvents = getUpcomingEvents(3);

  // Filter and organize events
  const dayData = useMemo(() => {
    const myTasks: Task[] = [];
    const openTasks: Task[] = [];
    const dayGoals: Goal[] = [];

    dayEvents.forEach(event => {
      const { type, data } = event.extendedProps;
      
      if (type === 'task') {
        const task = data as Task;
        if (task.assigneeId === userProfile?.id) {
          myTasks.push(task);
        } else if (!task.assigneeId && task.status !== 'Completed') {
          openTasks.push(task);
        }
      } else if (type === 'goal') {
        dayGoals.push(data as Goal);
      }
    });

    // Sort tasks by priority and status
    const sortTasks = (tasks: Task[]) => tasks.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const statusOrder = { 'Not Started': 1, 'In Progress': 2, 'Completed': 3 };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return {
      myTasks: sortTasks(myTasks),
      openTasks: sortTasks(openTasks),
      dayGoals,
      overdueCount: overdueItems.length
    };
  }, [dayEvents, userProfile?.id, overdueItems.length]);

  // Handle task status toggle
  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
      await updateDocument(task.id, {
        status: newStatus,
        completedDate: newStatus === 'Completed' ? new Date() : null,
        completedBy: newStatus === 'Completed' ? userProfile?.id : null
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

  // Handle claiming a task
  const handleClaimTask = async (task: Task) => {
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

  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return 'Unassigned';
    const assignee = teamMembers.find(m => m.id === assigneeId);
    return assignee?.name || 'Unknown';
  };

  const TaskItem: React.FC<{ 
    task: Task; 
    showAssignee?: boolean; 
    showClaimButton?: boolean;
  }> = ({ task, showAssignee = false, showClaimButton = false }) => {
    const isOverdue = isPast(task.dueDate) && task.status !== 'Completed';
    
    return (
      <div className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
        task.status === 'Completed' ? 'bg-green-50 border-green-200' :
        isOverdue ? 'bg-red-50 border-red-200' :
        'bg-white border-gray-200 hover:border-blue-300'
      }`}>
        <div className="flex items-start space-x-3">
          <button
            onClick={() => handleToggleTask(task)}
            className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              task.status === 'Completed' 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            {task.status === 'Completed' && (
              <CheckSquare className="h-3 w-3 text-white" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium ${
              task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h4>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                task.priority === 'High' ? 'bg-red-100 text-red-800' :
                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {task.priority}
              </span>
              
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status}
              </span>
              
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>
            
            {showAssignee && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span>{getAssigneeName(task.assigneeId)}</span>
              </div>
            )}
            
            {showClaimButton && !task.assigneeId && (
              <button
                onClick={() => handleClaimTask(task)}
                className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
              >
                Claim Task
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const GoalItem: React.FC<{ goal: Goal }> = ({ goal }) => (
    <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
      <div className="flex items-start space-x-3">
        <Target className="h-4 w-4 text-purple-600 mt-1" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{goal.title}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              goal.status === 'active' ? 'bg-green-100 text-green-800' :
              goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {goal.status}
            </span>
            <span className="text-xs text-gray-600">{goal.progress}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
        </h2>
        <p className="text-sm text-gray-600">
          {format(selectedDate, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onAddTask}
            className="flex items-center justify-center space-x-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Task</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm">
            <Target className="h-4 w-4" />
            <span>Goal</span>
          </button>
        </div>
      </div>

      {/* Overdue Alert */}
      {dayData.overdueCount > 0 && isToday(selectedDate) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-900">
                {dayData.overdueCount} Overdue Item{dayData.overdueCount !== 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-red-700">
                You have tasks that need immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Tasks for the Day */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
          My Tasks
          {dayData.myTasks.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {dayData.myTasks.length}
            </span>
          )}
        </h3>
        
        <div className="space-y-2">
          {dayData.myTasks.length > 0 ? (
            dayData.myTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No tasks assigned for this day</p>
              {isToday(selectedDate) && (
                <p className="text-xs mt-1">Great! You can focus on other priorities.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Goals Due */}
      {dayData.dayGoals.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Goals Due
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
              {dayData.dayGoals.length}
            </span>
          </h3>
          
          <div className="space-y-2">
            {dayData.dayGoals.map(goal => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Open Tasks (Available to Claim) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Flag className="h-5 w-5 mr-2 text-green-600" />
          Available Tasks
          {dayData.openTasks.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              {dayData.openTasks.length}
            </span>
          )}
        </h3>
        
        <div className="space-y-2">
          {dayData.openTasks.length > 0 ? (
            dayData.openTasks.map(task => (
              <TaskItem key={task.id} task={task} showClaimButton={true} />
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No open tasks for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events Preview */}
      {isToday(selectedDate) && upcomingEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Coming Up
          </h3>
          
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map(event => {
              const { type, data } = event.extendedProps;
              return (
                <div key={event.id} className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-indigo-600 font-medium">
                      {format(event.start, 'MMM d')}
                    </span>
                    <span className="text-sm text-gray-900 truncate">
                      {type === 'goal' ? '🎯' : '📋'} {(data as Task | Goal).title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Daily Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• {dayData.myTasks.length} task{dayData.myTasks.length !== 1 ? 's' : ''} assigned to you</p>
          <p>• {dayData.openTasks.length} task{dayData.openTasks.length !== 1 ? 's' : ''} available to claim</p>
          {dayData.dayGoals.length > 0 && (
            <p>• {dayData.dayGoals.length} goal{dayData.dayGoals.length !== 1 ? 's' : ''} due</p>
          )}
          {isToday(selectedDate) && dayData.overdueCount > 0 && (
            <p className="text-red-700 font-medium">• {dayData.overdueCount} overdue item{dayData.overdueCount !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyFocusSidebar;