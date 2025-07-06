import React from 'react';
import { TeamMember, Task, Goal } from '../../types';

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
}

interface SystemPanelProps {
  auditLogs?: AuditLog[];
  teamMembers?: TeamMember[];
  tasks?: Task[];
  goals?: Goal[];
}

const SystemPanel: React.FC<SystemPanelProps> = ({
  auditLogs,
  teamMembers,
  tasks,
  goals,
}) => {
  const auditArr = auditLogs || [];
  const teamArr = teamMembers || [];
  const taskArr = tasks || [];
  const goalArr = goals || [];

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  const now = new Date();

  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-4">System Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audit Logs */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Audit Logs</h3>
          <ul>
            <li>Total: {auditArr.length}</li>
            <li>
              Today: {auditArr.filter(log => new Date(log.timestamp) >= new Date(today.setHours(0,0,0,0))).length}
            </li>
            <li>
              This Week: {auditArr.filter(log => new Date(log.timestamp) >= startOfWeek).length}
            </li>
          </ul>
        </div>

        {/* Team Members */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Team Members</h3>
          <ul>
            <li>Total: {teamArr.length}</li>
            <li>
              Active:{' '}
              {teamArr.filter(member => member.status === 'active').length}
            </li>
            <li>
              Admins:{' '}
              {teamArr.filter(member => member.role === 'Admin').length}
            </li>
            <li>
              System Accounts:{' '}
              {teamArr.filter(member => member.isSystemAccount).length}
            </li>
          </ul>
        </div>

        {/* Tasks */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Tasks</h3>
          <ul>
            <li>Total: {taskArr.length}</li>
            <li>
              Active:{' '}
              {taskArr.filter(task => task.status !== 'Completed').length}
            </li>
            <li>
              Overdue:{' '}
              {taskArr.filter(
                task =>
                  new Date(task.dueDate) < now && task.status !== 'Completed'
              ).length}
            </li>
          </ul>
        </div>

        {/* Goals */}
        <div className="bg-white shadow rounded p-4">
          <h3 className="font-semibold mb-2">Goals</h3>
          <ul>
            <li>Total: {goalArr.length}</li>
            <li>
              Active:{' '}
              {goalArr.filter(goal => goal.status === 'active').length}
            </li>
            <li>
              Completed:{' '}
              {goalArr.filter(goal => goal.status === 'completed').length}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemPanel;