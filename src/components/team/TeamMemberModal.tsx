import React, { useState } from 'react';
import { TeamMember } from '../../types';
import { doc, updateDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebase'; // Correctly import 'firestore'
import { useNotification } from '../../context/NotificationContext';

interface TeamMemberModalProps {
  member: TeamMember;
  onClose: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, onClose }) => {
  const [status, setStatus] = useState(member.status);
  const { showNotification } = useNotification();

  const releaseAssignedTasks = async (terminatedUserId: string) => {
    try {
      const tasksRef = collection(firestore, 'tasks'); // Use 'firestore'
      const q = query(
        tasksRef,
        where('assigneeId', '==', terminatedUserId),
        where('status', '!=', 'Completed')
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return 0;
      }
      
      const batch = writeBatch(firestore); // Use 'firestore'
      querySnapshot.forEach(taskDoc => {
        const taskRef = doc(firestore, 'tasks', taskDoc.id); // Use 'firestore'
        batch.update(taskRef, {
          assigneeId: null,
          status: 'pending' // Or 'Not Started'
        });
      });

      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error("Error releasing tasks: ", error);
      showNotification({ type: 'error', title: 'Task Release Failed', message: 'Could not release assigned tasks.' });
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    const memberRef = doc(firestore, 'team', member.id); // Use 'firestore'
    let releasedTasksCount = 0;
    
    if (status === 'terminated' && member.status === 'active') {
      try {
        releasedTasksCount = await releaseAssignedTasks(member.uid);
        await updateDoc(memberRef, {
          status: 'terminated',
          terminatedDate: new Date(),
        });
        showNotification({ type: 'success', title: 'Member Terminated', message: `${member.name} has been terminated. ${releasedTasksCount} task(s) were released.` });
        onClose();
      } catch (error) {
        showNotification({ type: 'error', title: 'Action Failed', message: 'Could not terminate the member.' });
      }
    } else if (status !== member.status) {
      await updateDoc(memberRef, { status });
      showNotification({ type: 'success', title: 'Success', message: 'Member status updated.' });
      onClose();
    } else {
        onClose(); // No changes were made
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{member.name}</h2>
        <div className="space-y-4">
          <p><span className="font-medium">Email:</span> {member.email}</p>
          <p><span className="font-medium">Role:</span> {member.role}</p>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Member Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
            </select>
            {status === 'terminated' && (
               <p className="text-xs text-orange-600 mt-2">
                 Warning: This will release all of the member's assigned, incomplete tasks.
               </p>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
          <button type="button" onClick={handleSaveChanges} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;