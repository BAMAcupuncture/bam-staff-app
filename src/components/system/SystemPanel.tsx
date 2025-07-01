import React, { useState } from 'react';
import { Shield, Database, Activity, Users, Settings, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { AuditLog, TeamMember, Task, Goal } from '../../types';
import AuditLogsView from './AuditLogsView';
import SystemAdminRoute from '../auth/SystemAdminRoute';

type SystemPanelTab = 'audit-logs' | 'user-management' | 'system-health' | 'data-management' | 'settings';

const SystemPanelContent: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SystemPanelTab>('audit-logs');

  // Load system data for overview
  const { data: auditLogs } = useCollection<AuditLog>('auditLogs');
  const { data: teamMembers } = useCollection<TeamMember>('team');
  const { data: tasks } = useCollection<Task>('tasks');
  const { data: goals } = useCollection<Goal>('goals');

  // Calculate system statistics
  const systemStats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      auditLogs: {
        total: auditLogs.length,
        today: auditLogs.filter(log => log.timestamp >= today).length,
        thisWeek: auditLogs.filter(log => log.timestamp >= thisWeek).length
      },
      users: {
        total: teamMembers.length,
        active: teamMembers.filter(member => member.status === 'active').length,
        admins: teamMembers.filter(member => member.role === 'Admin').length,
        system: teamMembers.filter(member => member.isSystemAccount).length
      },
      tasks: {
        total: tasks.length,
        active: tasks.filter(task => task.status !== 'Completed').length,
        overdue: tasks.filter(task => task.dueDate < now && task.status !== 'Completed').length
      },
      goals: {
        total: goals.length,
        active: goals.filter(goal => goal.status === 'active').length,
        completed: goals.filter(goal => goal.status === 'completed').length
      }
    };
  }, [auditLogs, teamMembers, tasks, goals]);

  const tabs = [
    {
      id: 'audit-logs' as SystemPanelTab,
      name: 'Audit Logs',
      icon: FileText,
      description: 'View system activity and changes',
      badge: systemStats.auditLogs.today > 0 ? systemStats.auditLogs.today : undefined
    },
    {
      id: 'user-management' as SystemPanelTab,
      name: 'User Management',
      icon: Users,
      description: 'Advanced user administration',
      badge: systemStats.users.total
    },
    {
      id: 'system-health' as SystemPanelTab,
      name: 'System Health',
      icon: Activity,
      description: 'Monitor system performance',
      status: 'online'
    },
    {
      id: 'data-management' as SystemPanelTab,
      name: 'Data Management',
      icon: Database,
      description: 'Database operations and backups'
    },
    {
      id: 'settings' as SystemPanelTab,
      name: 'System Settings',
      icon: Settings,
      description: 'Configure system parameters'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'audit-logs':
        return <AuditLogsView />;
      
      case 'user-management':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemStats.users.total}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{systemStats.users.active}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{systemStats.users.admins}</div>
                  <div className="text-sm text-gray-600">Administrators</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{systemStats.users.system}</div>
                  <div className="text-sm text-gray-600">System Accounts</div>
                </div>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Advanced user management features coming soon...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the Team section for basic user management operations
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'system-health':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Dashboard</h3>
              
              {/* System Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Database</h4>
                      <p className="text-sm text-green-700">Firestore Connected</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Authentication</h4>
                      <p className="text-sm text-green-700">Firebase Auth Active</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Audit Logging</h4>
                      <p className="text-sm text-green-700">Active & Recording</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{systemStats.auditLogs.today}</div>
                  <div className="text-sm text-gray-600">Actions Today</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{systemStats.users.active}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{systemStats.tasks.active}</div>
                  <div className="text-sm text-gray-600">Active Tasks</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{systemStats.tasks.overdue}</div>
                  <div className="text-sm text-gray-600">Overdue Items</div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Detailed system monitoring coming soon...</p>
              </div>
            </div>
          </div>
        );
      
      case 'data-management':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Management</h3>
            <p className="text-gray-600 mb-4">Database backup and management tools coming soon...</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Collections</h4>
                <p className="text-2xl font-bold text-gray-600">8</p>
                <p className="text-xs text-gray-500">Active collections</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                <p className="text-2xl font-bold text-gray-600">
                  {systemStats.tasks.total + systemStats.goals.total + systemStats.users.total + systemStats.auditLogs.total}
                </p>
                <p className="text-xs text-gray-500">Total documents</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Storage</h4>
                <p className="text-2xl font-bold text-gray-600">~</p>
                <p className="text-xs text-gray-500">Database size</p>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">System configuration panel coming soon...</p>
            <div className="mt-6 text-left max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-3">Current Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Audit Logging:</span>
                  <span className="text-green-600 font-medium">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto-backup:</span>
                  <span className="text-blue-600 font-medium">Firebase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Rules:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">System Administration Panel</h1>
                <p className="text-sm text-gray-600">Advanced system management and monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 px-3 py-1 rounded-full">
                <span className="text-red-800 text-xs font-medium">SYSTEM ACCESS</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-900 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tab.name}</span>
                        {tab.badge && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {tab.badge}
                          </span>
                        )}
                        {tab.status === 'online' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* System Status */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Database</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Authentication</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Audit Logging</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="text-gray-500 text-xs">Auto</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Audit Logs Today:</span>
                  <span className="font-medium">{systemStats.auditLogs.today}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium">{systemStats.users.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">System Accounts:</span>
                  <span className="font-medium">{systemStats.users.system}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemPanel: React.FC = () => {
  return (
    <SystemAdminRoute>
      <SystemPanelContent />
    </SystemAdminRoute>
  );
};

export default SystemPanel;