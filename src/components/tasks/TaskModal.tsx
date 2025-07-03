import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, FileText, Target, AlertCircle } from 'lucide-react';
import useCollection from '../../hooks/useFirestore';
import { useNotification } from '../../context/NotificationContext';
import { Task, TeamMember, Goal } from '../../types';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task | null;
  goalId?: string | null; // Allow null for calendar creation
  teamMembers?: TeamMember[]; // Optional team members list
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string; // <-- ADD THIS NEW OPTIONAL PROP
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  goalId, 
  teamMembers: propTeamMembers, 
  onClose, 
  onSuccess,
  defaultDate // <-- NEW PROP
}) => {
  const { addDocument, updateDocument } = useFirestoreOperations('tasks');
  const { data: goals } = useCollection<Goal>('goals');
  const { data: fetchedTeamMembers } = useCollection<TeamMember>('team');
  const { addNotification } = useNotification();

  // Use provided team members or fetch them
  const teamMembers = propTeamMembers || fetchedTeamMembers;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Not Started' as Task['status'],
    priority: 'Medium' as Task['priority'],
    dueDate: '',
    assigneeId: '',
    goalId: goalId || '' // Pre-populate with provided goalId
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'Not Started',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
        assigneeId: task.assigneeId || '',
        goalId: task.goalId || goalId || ''
      });
    } else {
      // Set initial due date from defaultDate if creating, otherwise empty
      setFormData(prev => ({
        ...prev,
        dueDate: defaultDate || '',
        goalId: goalId || ''
      }));
    }
  }, [task, goalId, defaultDate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        dueDate: new Date(formData.dueDate),
        assigneeId: formData.assigneeId || null,
        goalId: formData.goalId || null, // Ensure goalId can be saved as null
        actionSteps: task?.actionSteps || [],
        ...(isEditing ? {} : { createdDate: new Date() })
      };

      if (isEditing && task) {
        await updateDocument(task.id, taskData);
        addNotification({
          type: 'success',
          title: 'Task Updated',
          message: `"${formData.title}" has been updated successfully.`
        });
      } else {
        await addDocument(taskData);
        addNotification({
          type: 'success',
          title: 'Task Created',
          message: `"${formData.title}" has been created successfully.`
        });
      }

      onSuccess();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: isEditing ? 'Update Failed' : 'Create Failed',
        message: error.message || 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Filter active team members
  const activeTeamMembers = teamMembers.filter(member => member.status === 'active');
  
  // Filter active goals
  const activeGoals = goals.filter(goal => goal.status === 'active');

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-2" />
            Task Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter task title"
            autoFocus={!isEditing}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task description (optional)"
          />
        </div>

        {/* Row 1: Assignee and Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Assign To
            </label>
            <select
              value={formData.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned (Open to Claim)</option>
              {activeTeamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Unassigned tasks can be claimed by any team member
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="h-4 w-4 inline mr-2" />
              Related Goal
            </label>
            <select
              value={formData.goalId}
              onChange={(e) => handleInputChange('goalId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!goalId} // Disable if goalId was provided (from goal detail view)
            >
              <option value="">No goal</option>
              {activeGoals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({goal.type})
                </option>
              ))}
            </select>
            {goalId && (
              <p className="mt-1 text-xs text-gray-500">
                This task will be linked to the current goal
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Due Date and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.dueDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.dueDate}
              </p>
            )}
            {defaultDate && !isEditing && (
              <p className="mt-1 text-xs text-blue-600">
                📅 Pre-filled with selected calendar date
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Flag className="h-4 w-4 inline mr-2" />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as Task['priority'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Status (only for editing) */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as Task['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        {/* Assignment Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Task Assignment</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Assigned:</strong> Task is immediately assigned to the selected team member</p>
            <p><strong>Unassigned:</strong> Task appears in the general task pool for anyone to claim</p>
            <p><strong>Status:</strong> Assigned tasks start as "In Progress", unassigned as "Not Started"</p>
            {defaultDate && !isEditing && (
              <p><strong>Calendar Integration:</strong> Due date pre-filled from selected calendar date</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              isEditing ? 'Update Task' : 'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskModal;