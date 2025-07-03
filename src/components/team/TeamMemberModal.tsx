import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, AlertCircle, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { TeamMember } from '../../types';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface TeamMemberModalProps {
  member?: TeamMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, onClose, onSuccess }) => {
  const { addDocument, updateDocument } = useFirestoreOperations('team');
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff' as 'Admin' | 'Staff',
    uid: '',
    status: 'active' as 'active' | 'terminated'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taskReleaseInfo, setTaskReleaseInfo] = useState<{
    count: number;
    loading: boolean;
  }>({ count: 0, loading: false });

  const isEditing = !!member;
  const isTerminating = formData.status === 'terminated' && member?.status === 'active';

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'Staff',
        uid: member.uid || '',
        status: member.status || 'active'
      });
    }
  }, [member]);

  // Check for assigned tasks when status changes to terminated
  useEffect(() => {
    const checkAssignedTasks = async () => {
      if (!isTerminating || !member) return;

      setTaskReleaseInfo(prev => ({ ...prev, loading: true }));

      try {
        const tasksRef = collection(db, 'tasks');
        const q = query(
          tasksRef,
          where('assigneeId', '==', member.id),
          where('status', '!=', 'Completed')
        );

        const querySnapshot = await getDocs(q);
        setTaskReleaseInfo({ count: querySnapshot.size, loading: false });
      } catch (error) {
        console.error('Error checking assigned tasks:', error);
        setTaskReleaseInfo({ count: 0, loading: false });
      }
    };

    checkAssignedTasks();
  }, [isTerminating, member]);

  const releaseAssignedTasks = async (terminatedUserId: string): Promise<number> => {
    try {
      // 1. Create a query to find all incomplete tasks assigned to the user
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('assigneeId', '==', terminatedUserId),
        where('status', '!=', 'Completed')
      );

      // 2. Get the documents
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return 0; // Return count of released tasks
      }

      // 3. Use a batch write for efficiency
      const batch = writeBatch(db);
      querySnapshot.forEach(taskDoc => {
        const taskRef = doc(db, 'tasks', taskDoc.id);
        batch.update(taskRef, {
          assigneeId: null, // Set assignee to null
          status: 'Not Started' // Reset status
        });
      });

      // 4. Commit the batch
      await batch.commit();
      
      return querySnapshot.size; // Return how many tasks were released
    } catch (error) {
      console.error("Error releasing tasks: ", error);
      addNotification({ 
        type: 'error', 
        title: 'Task Release Failed', 
        message: 'Could not release assigned tasks.' 
      });
      throw error; // Propagate error to stop the process
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.uid.trim()) {
      newErrors.uid = 'Firebase UID is required';
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
      let releasedTasksCount = 0;

      // Check if the status is changing to 'terminated'
      if (isTerminating && member) {
        try {
          // First, try to release the tasks
          releasedTasksCount = await releaseAssignedTasks(member.id);
        } catch (error) {
          // If releasing tasks failed, don't terminate the member
          addNotification({ 
            type: 'error', 
            title: 'Termination Failed', 
            message: 'Could not terminate the member due to task release error.' 
          });
          setLoading(false);
          return;
        }
      }

      const memberData = {
        ...formData,
        ...(isTerminating && {
          terminatedDate: new Date(),
          terminatedBy: member?.id // You might want to use current user's ID here
        }),
        ...(isEditing ? {} : { createdDate: new Date() })
      };

      if (isEditing && member) {
        await updateDocument(member.id, memberData);
        
        if (isTerminating) {
          addNotification({
            type: 'success',
            title: 'Member Terminated',
            message: `${formData.name} has been terminated. ${releasedTasksCount} task(s) were released and are now available for claiming.`
          });
        } else {
          addNotification({
            type: 'success',
            title: 'Member Updated',
            message: `${formData.name} has been updated successfully.`
          });
        }
      } else {
        await addDocument(memberData);
        addNotification({
          type: 'success',
          title: 'Member Added',
          message: `${formData.name} has been added to the team.`
        });
      }

      onSuccess();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: isEditing ? 'Update Failed' : 'Add Failed',
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number (optional)"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="h-4 w-4 inline mr-2" />
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Admins have full access to all features including team management
            </p>
          </div>

          {/* Firebase UID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firebase User ID *
            </label>
            <input
              type="text"
              value={formData.uid}
              onChange={(e) => handleInputChange('uid', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                errors.uid ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter Firebase Authentication UID"
            />
            {errors.uid && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.uid}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              This must match the user's Firebase Authentication UID exactly
            </p>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'terminated')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}

          {/* Task Release Warning */}
          {isTerminating && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-orange-900 mb-2">
                    Task Release Warning
                  </h4>
                  <div className="text-sm text-orange-800 space-y-2">
                    {taskReleaseInfo.loading ? (
                      <p>Checking assigned tasks...</p>
                    ) : (
                      <>
                        <p>
                          Terminating this member will release <strong>{taskReleaseInfo.count}</strong> incomplete task{taskReleaseInfo.count !== 1 ? 's' : ''} 
                          {taskReleaseInfo.count > 0 ? ' back to the general task pool.' : '.'}
                        </p>
                        {taskReleaseInfo.count > 0 && (
                          <div className="bg-orange-100 rounded p-2 mt-2">
                            <p className="font-medium">What happens next:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>All incomplete tasks will become unassigned</li>
                              <li>Task status will reset to "Not Started"</li>
                              <li>Tasks will be available for other team members to claim</li>
                              <li>This action cannot be undone</li>
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• The Firebase UID must match exactly for authentication to work</li>
              <li>• Users must already have a Firebase account created</li>
              <li>• Admin role grants access to team management and analytics</li>
              <li>• Staff role provides access to tasks, calendar, and goals</li>
              {isEditing && (
                <li>• Terminating a member will release all their incomplete tasks</li>
              )}
            </ul>
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
              disabled={loading || taskReleaseInfo.loading}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isTerminating 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>
                    {isTerminating ? 'Terminating...' : isEditing ? 'Updating...' : 'Adding...'}
                  </span>
                </div>
              ) : (
                <>
                  {isTerminating ? 'Terminate Member' : isEditing ? 'Update Member' : 'Add Member'}
                  {isTerminating && taskReleaseInfo.count > 0 && (
                    <span className="text-xs block">
                      (Will release {taskReleaseInfo.count} task{taskReleaseInfo.count !== 1 ? 's' : ''})
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberModal;
