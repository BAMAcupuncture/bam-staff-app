import React, { useState, useMemo } from 'react';
import useCollection from '../../hooks/useFirestore';
import { Task, TeamMember } from '../../types';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

// A simple component for displaying a single task row
const TaskRow: React.FC<{ task: Task; teamMembers: TeamMember[] }> = ({ task, teamMembers }) => {
  const assignee = teamMembers.find(m => m.uid === task.assigneeId);
  return (
    <tr className="bg-white hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignee?.name || 'Unassigned'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.status}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(task.dueDate, 'MMM dd, yyyy')}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.priority}</td>
    </tr>
  );
};

const TasksView: React.FC = () => {
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: teamMembers, loading: teamLoading } = useCollection<TeamMember>('team');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTasks = useMemo(() => {
    // This is the fix: (tasks || []) ensures we always filter an array
    if (!tasks) return [];
    return tasks.filter(task => {
      if (filterStatus === 'all') return true;
      return task.status === filterStatus;
    });
  }, [tasks, filterStatus]);

  const loading = tasksLoading || teamLoading;

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center">
          <Plus size={20} className="mr-2" /> New Task
        </button>
      </div>

      {/* Add filter buttons here later if needed */}

      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <TaskRow key={task.id} task={task} teamMembers={teamMembers || []} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TasksView;