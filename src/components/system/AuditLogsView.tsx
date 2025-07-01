import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, RefreshCw, Eye, Calendar, User, Database, AlertCircle } from 'lucide-react';
import { useCollection } from '../../hooks/useFirestore';
import { AuditLog } from '../../types';
import { format, isToday, isYesterday, subDays } from 'date-fns';

const AuditLogsView: React.FC = () => {
  const { data: auditLogs, loading, error } = useCollection<AuditLog>('auditLogs');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Sort logs by timestamp (newest first)
  const sortedLogs = useMemo(() => {
    return [...auditLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [auditLogs]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    return sortedLogs.filter(log => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          log.userName.toLowerCase().includes(searchLower) ||
          log.userEmail.toLowerCase().includes(searchLower) ||
          log.collectionName.toLowerCase().includes(searchLower) ||
          log.docId.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.changes).toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Collection filter
      if (collectionFilter !== 'all' && log.collectionName !== collectionFilter) return false;

      // User filter
      if (userFilter !== 'all' && log.userId !== userFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            if (!isToday(logDate)) return false;
            break;
          case 'yesterday':
            if (!isYesterday(logDate)) return false;
            break;
          case 'week':
            if (logDate < subDays(now, 7)) return false;
            break;
          case 'month':
            if (logDate < subDays(now, 30)) return false;
            break;
        }
      }

      return true;
    });
  }, [sortedLogs, searchTerm, actionFilter, collectionFilter, userFilter, dateFilter]);

  // Get unique values for filter dropdowns
  const uniqueActions = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.action))];
  }, [auditLogs]);

  const uniqueCollections = useMemo(() => {
    return [...new Set(auditLogs.map(log => log.collectionName))];
  }, [auditLogs]);

  const uniqueUsers = useMemo(() => {
    return [...new Set(auditLogs.map(log => ({ id: log.userId, name: log.userName, email: log.userEmail })))];
  }, [auditLogs]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayLogs = auditLogs.filter(log => isToday(log.timestamp));
    const weekLogs = auditLogs.filter(log => log.timestamp >= subDays(today, 7));
    
    return {
      total: auditLogs.length,
      today: todayLogs.length,
      week: weekLogs.length,
      actions: {
        CREATE: auditLogs.filter(log => log.action === 'CREATE').length,
        UPDATE: auditLogs.filter(log => log.action === 'UPDATE').length,
        DELETE: auditLogs.filter(log => log.action === 'DELETE').length,
        LOGIN: auditLogs.filter(log => log.action === 'LOGIN').length,
      }
    };
  }, [auditLogs]);

  const getActionColor = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ACCESS_DENIED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return `Today at ${format(timestamp, 'HH:mm:ss')}`;
    } else if (isYesterday(timestamp)) {
      return `Yesterday at ${format(timestamp, 'HH:mm:ss')}`;
    } else {
      return format(timestamp, 'MMM d, yyyy HH:mm:ss');
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Collection', 'Document ID', 'Changes'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        `"${log.userName} (${log.userEmail})"`,
        log.action,
        log.collectionName,
        log.docId,
        `"${JSON.stringify(log.changes).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-gray-600">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error loading audit logs: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
            <p className="text-gray-600 mt-1">Comprehensive system activity tracking and monitoring</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.week}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.actions.CREATE}</div>
            <div className="text-sm text-gray-600">Creates</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.actions.UPDATE}</div>
            <div className="text-sm text-gray-600">Updates</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.actions.DELETE}</div>
            <div className="text-sm text-gray-600">Deletes</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.actions.LOGIN}</div>
            <div className="text-sm text-gray-600">Logins</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by user, collection, document ID, or changes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Collections</option>
              {uniqueCollections.map(collection => (
                <option key={collection} value={collection}>{collection}</option>
              ))}
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredLogs.length} of {auditLogs.length} audit log entries
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                        <div className="text-sm text-gray-500">{log.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{log.collectionName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {log.docId.length > 20 ? `${log.docId.substring(0, 20)}...` : log.docId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate">
                      {JSON.stringify(log.changes).length > 100 
                        ? `${JSON.stringify(log.changes).substring(0, 100)}...`
                        : JSON.stringify(log.changes)
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">
              {searchTerm || actionFilter !== 'all' || collectionFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'No audit logs have been recorded yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                      <dd className="text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">User</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userEmail})</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Action</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Collection</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.collectionName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Document ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedLog.docId}</dd>
                    </div>
                  </dl>
                </div>

                {selectedLog.metadata && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
                    <dl className="space-y-2">
                      {selectedLog.metadata.userAgent && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                          <dd className="text-sm text-gray-900 break-all">{selectedLog.metadata.userAgent}</dd>
                        </div>
                      )}
                      {selectedLog.metadata.sessionId && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Session ID</dt>
                          <dd className="text-sm text-gray-900 font-mono">{selectedLog.metadata.sessionId}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Changes</h4>
                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>

              {selectedLog.metadata?.previousValues && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Previous Values</h4>
                  <pre className="bg-red-50 rounded-lg p-4 text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata.previousValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata?.newValues && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">New Values</h4>
                  <pre className="bg-green-50 rounded-lg p-4 text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsView;