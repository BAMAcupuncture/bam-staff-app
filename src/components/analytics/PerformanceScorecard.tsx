import React from 'react';
import { TeamMember, Task } from '../../types';

interface PerformanceScorecardProps {
  team?: TeamMember[];
  tasks?: Task[];
}

const PerformanceScorecard: React.FC<PerformanceScorecardProps> = ({ team, tasks }) => {
  // Fallback to empty arrays if undefined
  const teamArr = team || [];
  const tasksArr = tasks || [];

  const performanceData = teamArr
    .filter(member => member.status === 'active')
    .map(member => {
      const assignedTasks = tasksArr.filter(task => task.assigneeId === member.id);
      const totalAssigned = assignedTasks.length;

      const completed = assignedTasks.filter(t => t.status === 'Completed').length;
      const overdue = assignedTasks.filter(
        t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()
      ).length;

      return {
        member,
        totalAssigned,
        completed,
        overdue,
      };
    });

  return (
    <div>
      <h2 className="font-bold text-lg mb-2">Performance Scorecard</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assigned</th>
              <th>Completed</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map(({ member, totalAssigned, completed, overdue }) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{totalAssigned}</td>
                <td>{completed}</td>
                <td>{overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceScorecard;