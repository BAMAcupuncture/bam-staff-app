import React from 'react';
import { Task, TeamMember } from '../../types';

interface ScorecardProps {
  tasks: Task[];
  team: TeamMember[];
}

const PerformanceScorecard: React.FC<ScorecardProps> = ({ tasks, team }) => {
  // --- Performance Calculation Logic ---
  const performanceData = team
    .filter(member => member.status === 'active') // Only include active members
    .map(member => {
      const assignedTasks = tasks.filter(task => task.assigneeId === member.id);
      const totalAssigned = assignedTasks.length;

      if (totalAssigned === 0) {
        return {
          id: member.id,
          name: member.name,
          totalAssigned: 0,
          completed: 0,
          overdue: 0,
          completionRate: 0, // Avoid division by zero, show as 0%
        };
      }

      const completed = assignedTasks.filter(t => t.status === 'Completed').length;
      const overdue = assignedTasks.filter(
        t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()
      ).length;
      
      const completionRate = Math.round((completed / totalAssigned) * 100);

      return {
        id: member.id,
        name: member.name,
        totalAssigned,
        completed,
        overdue,
        completionRate,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate); // Sort by highest completion rate first

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Individual Performance Scorecard</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Member
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed / Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tasks Overdue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceData.map(member => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-4 mr-3">
                      <div 
                        className={`h-4 rounded-full transition-all duration-300 ${
                          member.completionRate >= 80 ? 'bg-green-500' :
                          member.completionRate >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${member.completionRate}%`}}
                      ></div>
                    </div>
                    <span className={`font-medium ${
                      member.completionRate >= 80 ? 'text-green-600' :
                      member.completionRate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {member.completionRate}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-800">
                    <span className="font-medium text-green-600">{member.completed}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="font-medium">{member.totalAssigned}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.overdue === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.overdue === 0 ? 'On Track' : `${member.overdue} Overdue`}
                  </span>
                </td>
              </tr>
            ))}
            {performanceData.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                  No active team members to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {performanceData.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>80%+ completion rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>60-79% completion rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Below 60% completion rate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceScorecard;