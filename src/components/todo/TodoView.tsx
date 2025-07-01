import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ClinicalWorkbench from './ClinicalWorkbench';
import KanbanBoard from './KanbanBoard';

const TodoView: React.FC = () => {
  const { userProfile } = useAuth();

  // Assuming 'Admin' role is used for Jonathan/Clinician for simplicity
  // You might have a dedicated 'Clinician' role
  const isClinician = userProfile?.role === 'Admin'; 

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">To-Do Center</h1>

      {isClinician && (
        <div className="mb-8">
          <ClinicalWorkbench />
        </div>
      )}

      <div>
        <KanbanBoard />
      </div>
    </div>
  );
};

export default TodoView;