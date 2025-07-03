import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, Shield, UserCheck, UserX, Search, Filter } from 'lucide-react';
import useCollection from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { TeamMember } from '../../types';
import TeamMemberModal from './TeamMemberModal';
import ConfirmDialog from '../ui/ConfirmDialog';

const TeamView: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: teamMembers, loading } = useCollection<TeamMember>('team');
  const { updateDocument, deleteDocument } = useFirestoreOperations('team');
  const { addNotification } = useNotifications();

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'terminated'>('all');

  const isAdmin = userProfile?.role === 'Admin';

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeMembers = teamMembers.filter(m => m.status === 'active');
  const terminatedMembers = teamMembers.filter(m => m.status === 'terminated');
  const adminCount = activeMembers.filter(m => m.role === 'Admin').length;
  const staffCount = activeMembers.filter(m => m.role === 'Staff').length;

  const handleAddMember = () => {
    setEditingMember(null);
    setShowModal(true);
  };

  const handleEditMember = (member: TeamMember) => {
    if (!isAdmin) {
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'Only administrators can edit team members.'
      });
      return;
    }
    setEditingMember(member);
    setShowModal(true);
  };

  const handleDeleteMember = (member: TeamMember) => {
    if (!isAdmin) {
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'Only administrators can delete team members.'
      });
      return;
    }

    if (member.id === userProfile?.id) {
      addNotification({
        type: 'error',
        title: 'Cannot Delete',
        message: 'You cannot delete your own account.'
      });
      return;
    }

    setMemberToDelete(member);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await deleteDocument(memberToDelete.id);
      addNotification({
        type: 'success',
        title: 'Member Deleted',
        message: `${memberToDelete.name} has been removed from the team.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete team member. Please try again.'
      });
    } finally {
      setShowConfirmDialog(false);
      setMemberToDelete(null);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (!isAdmin) {
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'Only administrators can change member status.'
      });
      return;
    }

    if (member.id === userProfile?.id) {
      addNotification({
        type: 'error',
        title: 'Cannot Modify',
        message: 'You cannot change your own status.'
      });
      return;
    }

    try {
      const newStatus = member.status === 'active' ? 'terminated' : 'active';
      const updateData: Partial<TeamMember> = {
        status: newStatus,
        ...(newStatus === 'terminated' && {
          terminatedDate: new Date(),
          terminatedBy: userProfile?.id
        }),
        ...(newStatus === 'active' && {
          terminatedDate: undefined,
          terminatedBy: undefined,
          terminationReason: undefined
        })
      };

      await updateDocument(member.id, updateData);
      
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `${member.name} has been ${newStatus === 'active' ? 'reactivated' : 'terminated'}.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update member status. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your team members and their access</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleAddMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Compact Team Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Team Overview</h3>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-1 rounded">
                <Users className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">{teamMembers.length}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-1 rounded">
                <UserCheck className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-gray-900">{activeMembers.length}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded">
                <Shield className="h-3 w-3 text-purple-600" />
              </div>
              <span className="text-gray-600">Admins:</span>
              <span className="font-semibold text-gray-900">{adminCount}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-orange-100 p-1 rounded">
                <Users className="h-3 w-3 text-orange-600" />
              </div>
              <span className="text-gray-600">Staff:</span>
              <span className="font-semibold text-gray-900">{staffCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'terminated')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({filteredMembers.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      member.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {member.status === 'active' ? (
                        <UserCheck className="h-6 w-6 text-green-600" />
                      ) : (
                        <UserX className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.role === 'Admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{member.email}</p>
                        {member.phone && <p>Phone: {member.phone}</p>}
                        {member.terminatedDate && (
                          <p className="text-red-600">
                            Terminated: {member.terminatedDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(member)}
                        disabled={member.id === userProfile?.id}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          member.status === 'active'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {member.status === 'active' ? 'Terminate' : 'Reactivate'}
                      </button>
                      
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteMember(member)}
                        disabled={member.id === userProfile?.id}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first team member to get started'
                }
              </p>
              {isAdmin && (
                <button
                  onClick={handleAddMember}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Team Member
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <TeamMemberModal
          member={editingMember}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setEditingMember(null);
          }}
        />
      )}

      {showConfirmDialog && memberToDelete && (
        <ConfirmDialog
          title="Delete Team Member"
          message={`Are you sure you want to permanently delete ${memberToDelete.name}? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmDialog(false);
            setMemberToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default TeamView;