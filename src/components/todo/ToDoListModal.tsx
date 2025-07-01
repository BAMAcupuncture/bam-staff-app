import React, { useState, useEffect } from 'react';
import { X, Folder, Users, User, Lock, Palette, Settings, AlertCircle } from 'lucide-react';
import { useFirestoreOperations, useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ToDoList, TeamMember } from '../../types';

interface ToDoListModalProps {
  list?: ToDoList | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ToDoListModal: React.FC<ToDoListModalProps> = ({ list, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const { addDocument, updateDocument } = useFirestoreOperations('todoLists');
  const { data: teamMembers } = useCollection<TeamMember>('team');
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'personal' as ToDoList['type'],
    color: '#3b82f6',
    sharedWith: [] as string[],
    settings: {
      allowReordering: true,
      showCompletedItems: true,
      autoArchiveCompleted: false,
      requireDueDates: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!list;
  const activeTeamMembers = teamMembers.filter(member => member.status === 'active');

  // Predefined color options
  const colorOptions = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ];

  useEffect(() => {
    if (list) {
      setFormData({
        title: list.title || '',
        description: list.description || '',
        type: list.type || 'personal',
        color: list.color || '#3b82f6',
        sharedWith: list.sharedWith || [],
        settings: {
          allowReordering: list.settings?.allowReordering ?? true,
          showCompletedItems: list.settings?.showCompletedItems ?? true,
          autoArchiveCompleted: list.settings?.autoArchiveCompleted ?? false,
          requireDueDates: list.settings?.requireDueDates ?? false
        }
      });
    }
  }, [list]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.type === 'shared' && formData.sharedWith.length === 0) {
      newErrors.sharedWith = 'Please select at least one team member for shared lists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userProfile) {
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const listData: Partial<ToDoList> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        color: formData.color,
        sharedWith: formData.type === 'shared' ? formData.sharedWith : undefined,
        settings: formData.settings,
        lastModified: now,
        ...(isEditing ? {} : {
          createdBy: userProfile.id,
          createdDate: now,
          isArchived: false,
          order: 0
        })
      };

      if (isEditing && list) {
        await updateDocument(list.id, listData);
      } else {
        await addDocument(listData);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [setting]: value }
    }));
  };

  const handleSharedWithChange = (memberId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: checked 
        ? [...prev.sharedWith, memberId]
        : prev.sharedWith.filter(id => id !== memberId)
    }));
    if (errors.sharedWith) {
      setErrors(prev => ({ ...prev, sharedWith: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Folder className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit To-Do List' : 'Create New To-Do List'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                List Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter list title"
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description for this list"
              />
            </div>

            {/* Type and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as ToDoList['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="personal">Personal</option>
                  <option value="shared">Shared</option>
                  <option value="department">Department</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.type === 'personal' && 'Only you can see and edit this list'}
                  {formData.type === 'shared' && 'Selected team members can collaborate'}
                  {formData.type === 'department' && 'All department members can access'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="h-4 w-4 inline mr-1" />
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange('color', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sharing Settings */}
          {formData.type === 'shared' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sharing Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Share with Team Members *
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {activeTeamMembers.map(member => (
                    <label key={member.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sharedWith.includes(member.id)}
                        onChange={(e) => handleSharedWithChange(member.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-1 rounded-full">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500">({member.role})</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.sharedWith && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.sharedWith}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* List Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              List Settings
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.allowReordering}
                  onChange={(e) => handleSettingChange('allowReordering', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Allow drag-and-drop reordering</span>
                  <p className="text-xs text-gray-500">Users can reorder items by dragging them</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.showCompletedItems}
                  onChange={(e) => handleSettingChange('showCompletedItems', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Show completed items</span>
                  <p className="text-xs text-gray-500">Display completed items in the list (with strikethrough)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.autoArchiveCompleted}
                  onChange={(e) => handleSettingChange('autoArchiveCompleted', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Auto-archive completed items</span>
                  <p className="text-xs text-gray-500">Automatically hide items after 7 days of completion</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.requireDueDates}
                  onChange={(e) => handleSettingChange('requireDueDates', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Require due dates</span>
                  <p className="text-xs text-gray-500">All new items must have a due date</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
                isEditing ? 'Update List' : 'Create List'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToDoListModal;